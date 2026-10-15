import json
import uuid
import datetime
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import (
    UserProfile, City, Theatre, Screen, Seat,
    Movie, Show, SeatHold, Booking, BookingSeat,
    Payment, PaymentEvent, Ticket, TicketScan
)
from .serializers import (
    UserSerializer, RegisterSerializer, CitySerializer,
    TheatreSerializer, ScreenSerializer, SeatSerializer,
    MovieSerializer, ShowSerializer, BookingSerializer,
    TicketSerializer, TicketScanSerializer
)
from .permissions import IsTheatreStaff, IsPlatformAdmin, IsBookingOwnerOrStaff
from .utils import (
    generate_secure_token, generate_qr_code_base64,
    clean_expired_holds, verify_razorpay_signature
)


# ==============================================================================
# AUTHENTICATION VIEWS
# ==============================================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    Registers a new user (customer or staff) and returns their auth token.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Authenticates user and returns auth token with role and assigned theatre.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': 'Login successful'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    """
    Returns current authenticated user profile.
    """
    return Response(UserSerializer(request.user).data)


# ==============================================================================
# PUBLIC CATALOGUE VIEWS
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def cities_list(request):
    cities = City.objects.filter(is_active=True)
    return Response(CitySerializer(cities, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def theatres_list(request):
    qs = Theatre.objects.filter(is_active=True)
    city_id = request.query_params.get('city')
    if city_id:
        qs = qs.filter(city_id=city_id)
    return Response(TheatreSerializer(qs, many=True).data)


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Movie.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        
        genre = self.request.query_params.get('genre')
        if genre and genre.lower() != 'all':
            qs = qs.filter(genre__icontains=genre)

        lang = self.request.query_params.get('language')
        if lang and lang.lower() != 'all':
            qs = qs.filter(language__iexact=lang)

        search = self.request.query_params.get('search')
        if search:
            search_str = search.strip()
            if search_str:
                from django.db.models import Q
                qs = qs.filter(
                    Q(title__icontains=search_str) |
                    Q(cast__icontains=search_str) |
                    Q(director__icontains=search_str) |
                    Q(genre__icontains=search_str)
                )

        city_id = self.request.query_params.get('city')
        if city_id and status_param != 'COMING_SOON':
            qs = qs.filter(shows__screen__theatre__city_id=city_id, shows__is_active=True).distinct()

        return qs


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def shows_list(request):
    """
    List scheduled shows filtered by movie, city, theatre, or date.
    """
    qs = Show.objects.filter(is_active=True).select_related('movie', 'screen__theatre__city')
    
    movie_id = request.query_params.get('movie')
    if movie_id:
        qs = qs.filter(movie_id=movie_id)
        
    theatre_id = request.query_params.get('theatre')
    if theatre_id:
        qs = qs.filter(screen__theatre_id=theatre_id)

    city_id = request.query_params.get('city')
    if city_id:
        qs = qs.filter(screen__theatre__city_id=city_id)

    date_str = request.query_params.get('date')
    if date_str:
        try:
            target_date = datetime.date.fromisoformat(date_str)
            qs = qs.filter(date=target_date)
        except ValueError:
            pass

    return Response(ShowSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def show_detail(request, pk):
    try:
        show = Show.objects.select_related('movie', 'screen__theatre__city').get(pk=pk, is_active=True)
    except Show.DoesNotExist:
        return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ShowSerializer(show).data)


# ==============================================================================
# SEAT MAP & SEAT HOLD VIEWS
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def show_seats(request, pk):
    """
    Returns seat layout for a show screen, with accurate current status:
    - 'BOOKED': already purchased in confirmed booking
    - 'HELD': temporarily reserved by someone else
    - 'MY_HELD': temporarily reserved by current user/session
    - 'AVAILABLE': open for selection
    """
    try:
        show = Show.objects.select_related('screen').get(pk=pk)
    except Show.DoesNotExist:
        return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)

    # 1. Clean expired holds first
    clean_expired_holds(show)

    # 2. Get all seats in screen
    seats = Seat.objects.filter(screen=show.screen).order_by('row', 'number')

    # 3. Get confirmed booked seat IDs for this show
    booked_seat_ids = set(
        BookingSeat.objects.filter(
            show=show,
            booking__status='CONFIRMED'
        ).values_list('seat_id', flat=True)
    )

    # 4. Get active holds for this show
    now = timezone.now()
    active_holds = SeatHold.objects.filter(show=show, expires_at__gt=now)

    user = request.user if request.user.is_authenticated else None
    session_id = request.query_params.get('session_id', '')

    my_held_seat_ids = set()
    other_held_seat_ids = set()

    for hold in active_holds:
        is_mine = False
        if user and hold.user == user:
            is_mine = True
        elif session_id and hold.session_id == session_id:
            is_mine = True
        
        if is_mine:
            my_held_seat_ids.add(hold.seat_id)
        else:
            other_held_seat_ids.add(hold.seat_id)

    # 5. Format seat layout
    seat_list = []
    for s in seats:
        seat_status = 'AVAILABLE'
        if s.id in booked_seat_ids:
            seat_status = 'BOOKED'
        elif s.id in my_held_seat_ids:
            seat_status = 'MY_HELD'
        elif s.id in other_held_seat_ids:
            seat_status = 'HELD'

        price = show.get_price_for_category(s.category)
        seat_list.append({
            'id': s.id,
            'row': s.row,
            'number': s.number,
            'seat_label': s.seat_label,
            'category': s.category,
            'price': float(price),
            'status': seat_status
        })

    return Response({
        'show_id': show.id,
        'screen_name': show.screen.name,
        'theatre_name': show.screen.theatre.name,
        'total_capacity': show.screen.total_capacity,
        'prices': {
            'regular': float(show.price_regular),
            'premium': float(show.price_premium),
            'recliner': float(show.price_recliner),
        },
        'seats': seat_list
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def hold_seats_view(request, pk):
    """
    Temporarily holds one or more seats for 5 minutes during checkout.
    Uses database row-level locking (select_for_update) to prevent race conditions.
    """
    try:
        show = Show.objects.get(pk=pk, is_active=True)
    except Show.DoesNotExist:
        return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)

    seat_ids = request.data.get('seat_ids', [])
    session_id = request.data.get('session_id', '')
    user = request.user if request.user.is_authenticated else None

    if not seat_ids or not isinstance(seat_ids, list):
        return Response({'error': 'List of seat_ids required'}, status=status.HTTP_400_BAD_REQUEST)

    # Atomic transaction with concurrency safety
    with transaction.atomic():
        # First purge any expired holds for this show
        clean_expired_holds(show)

        # Check if any requested seat is already booked
        already_booked = BookingSeat.objects.filter(
            show=show,
            seat_id__in=seat_ids,
            booking__status='CONFIRMED'
        ).values_list('seat__seat_label', flat=True)

        if already_booked:
            return Response({
                'error': f"Seat(s) {', '.join(already_booked)} are already booked by another customer.",
                'conflict_seats': list(already_booked)
            }, status=status.HTTP_409_CONFLICT)

        # Check if held by someone else
        now = timezone.now()
        active_holds_qs = SeatHold.objects.select_for_update().filter(
            show=show,
            seat_id__in=seat_ids,
            expires_at__gt=now
        )
        
        conflict_held = []
        for hold in active_holds_qs:
            is_mine = (user and hold.user == user) or (session_id and hold.session_id == session_id)
            if not is_mine:
                conflict_held.append(hold.seat.seat_label)

        if conflict_held:
            return Response({
                'error': f"Seat(s) {', '.join(conflict_held)} are currently held by another user in checkout.",
                'conflict_seats': conflict_held
            }, status=status.HTTP_409_CONFLICT)

        # Release existing holds for this user/session on this show to refresh
        if user:
            SeatHold.objects.filter(show=show, user=user).delete()
        elif session_id:
            SeatHold.objects.filter(show=show, session_id=session_id).delete()

        # Create new holds
        hold_duration = datetime.timedelta(minutes=settings.SEAT_HOLD_DURATION_MINUTES)
        expires_at = now + hold_duration

        seats = Seat.objects.filter(id__in=seat_ids, screen=show.screen)
        if len(seats) != len(seat_ids):
            return Response({'error': 'Invalid seat ID(s) provided'}, status=status.HTTP_400_BAD_REQUEST)

        new_holds = []
        for seat in seats:
            new_holds.append(SeatHold(
                show=show,
                seat=seat,
                user=user,
                session_id=session_id,
                expires_at=expires_at
            ))
        SeatHold.objects.bulk_create(new_holds)

    return Response({
        'message': f"Seats held successfully for {settings.SEAT_HOLD_DURATION_MINUTES} minutes",
        'held_seat_ids': seat_ids,
        'expires_at': expires_at.isoformat(),
        'remaining_seconds': settings.SEAT_HOLD_DURATION_MINUTES * 60
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def release_seats_view(request, pk):
    """
    Releases any active seat holds for this user or session.
    """
    user = request.user if request.user.is_authenticated else None
    session_id = request.data.get('session_id', '')

    qs = SeatHold.objects.filter(show_id=pk)
    if user:
        qs = qs.filter(user=user)
    elif session_id:
        qs = qs.filter(session_id=session_id)
    else:
        return Response({'message': 'No session or user specified'}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count, _ = qs.delete()
    return Response({'message': f'Released {deleted_count} seat holds'})


# ==============================================================================
# BOOKING & PAYMENT FLOW
# ==============================================================================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_booking_view(request):
    """
    Initiates a booking, locks seats, calculates pricing on server,
    and creates order for payment (Razorpay test mode or Simulated).
    """
    show_id = request.data.get('show_id')
    seat_ids = request.data.get('seat_ids', [])
    payment_method = request.data.get('payment_method', 'SIMULATED_CARD') # or 'RAZORPAY_TEST', 'SIMULATED_UPI'

    if not show_id or not seat_ids or not isinstance(seat_ids, list):
        return Response({'error': 'show_id and list of seat_ids required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        show = Show.objects.select_related('movie', 'screen__theatre').get(pk=show_id, is_active=True)
    except Show.DoesNotExist:
        return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        # Clean expired holds
        clean_expired_holds(show)

        # 1. Authoritative check: Verify seats are not already booked
        already_booked = BookingSeat.objects.filter(
            show=show,
            seat_id__in=seat_ids,
            booking__status='CONFIRMED'
        ).values_list('seat__seat_label', flat=True)

        if already_booked:
            return Response({
                'error': f"Seat(s) {', '.join(already_booked)} are already booked.",
                'conflict_seats': list(already_booked)
            }, status=status.HTTP_409_CONFLICT)

        # 2. Check seats belong to this screen and get category prices
        seats = list(Seat.objects.filter(id__in=seat_ids, screen=show.screen))
        if len(seats) != len(seat_ids):
            return Response({'error': 'One or more invalid seat IDs for this screen'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate exact server-side pricing
        base_amount = Decimal('0.00')
        seat_price_map = {}
        for s in seats:
            p = show.get_price_for_category(s.category)
            seat_price_map[s.id] = p
            base_amount += p

        ticket_count = len(seats)
        convenience_fee = Decimal(str(settings.CONVENIENCE_FEE_PER_TICKET)) * ticket_count
        tax_amount = (convenience_fee * Decimal(str(settings.TAX_RATE_PERCENTAGE))) / Decimal('100.00')
        tax_amount = tax_amount.quantize(Decimal('0.01'))
        grand_total = (base_amount + convenience_fee + tax_amount).quantize(Decimal('0.01'))

        # Generate unique booking reference
        today_str = datetime.date.today().strftime('%Y%m%d')
        ref_suffix = uuid.uuid4().hex[:6].upper()
        booking_ref = f"CB-{today_str}-{ref_suffix}"

        # Create Booking
        booking = Booking.objects.create(
            booking_reference=booking_ref,
            user=request.user,
            show=show,
            total_tickets=ticket_count,
            base_amount=base_amount,
            convenience_fee=convenience_fee,
            tax_amount=tax_amount,
            grand_total=grand_total,
            status='PENDING'
        )

        # Create BookingSeats
        booking_seats = []
        for s in seats:
            booking_seats.append(BookingSeat(
                booking=booking,
                show=show,
                seat=s,
                category=s.category,
                price=seat_price_map[s.id]
            ))
        BookingSeat.objects.bulk_create(booking_seats)

        # Setup Payment record
        txn_id = f"txn_{uuid.uuid4().hex}"
        gateway_order_id = f"order_{uuid.uuid4().hex[:14]}"
        is_simulated = payment_method.startswith('SIMULATED') or settings.RAZORPAY_SIMULATED_MODE

        # If actual Razorpay integration credentials provided and requested
        if payment_method == 'RAZORPAY_TEST' and not settings.RAZORPAY_SIMULATED_MODE:
            try:
                import razorpay
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                amount_in_paise = int(grand_total * 100)
                order_payload = {
                    'amount': amount_in_paise,
                    'currency': 'INR',
                    'receipt': booking.booking_reference,
                    'notes': {
                        'booking_ref': booking.booking_reference,
                        'movie': show.movie.title,
                        'theatre': show.screen.theatre.name
                    }
                }
                rzp_order = client.order.create(data=order_payload)
                gateway_order_id = rzp_order['id']
                is_simulated = False
            except Exception as e:
                # Fallback to simulated if Razorpay client failed
                is_simulated = True

        payment = Payment.objects.create(
            booking=booking,
            payment_method=payment_method,
            transaction_id=txn_id,
            gateway_order_id=gateway_order_id,
            amount=grand_total,
            currency='INR',
            status='PENDING',
            is_simulated=is_simulated
        )

        PaymentEvent.objects.create(
            payment=payment,
            event_type='ORDER_CREATED',
            payload={'order_id': gateway_order_id, 'amount': str(grand_total)}
        )

    return Response({
        'booking_reference': booking.booking_reference,
        'booking_id': booking.id,
        'show_title': show.movie.title,
        'theatre_name': show.screen.theatre.name,
        'screen_name': show.screen.name,
        'date': show.date.isoformat(),
        'start_time': show.start_time.strftime('%I:%M %p'),
        'total_tickets': ticket_count,
        'base_amount': float(base_amount),
        'convenience_fee': float(convenience_fee),
        'tax_amount': float(tax_amount),
        'grand_total': float(grand_total),
        'currency': 'INR',
        'gateway_order_id': gateway_order_id,
        'razorpay_key': settings.RAZORPAY_KEY_ID,
        'is_simulated': is_simulated,
        'payment_method': payment_method,
        'seats': [f"{s.seat_label} ({s.category})" for s in seats]
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment_view(request, booking_ref):
    """
    Verifies payment (Razorpay signature or Simulated gateway confirmation),
    authoritatively marks booking as CONFIRMED, and issues QR E-Ticket.
    Guarantees idempotency.
    """
    try:
        booking = Booking.objects.select_related('show__movie', 'show__screen__theatre', 'payment').get(
            booking_reference=booking_ref,
            user=request.user
        )
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    payment = booking.payment

    # Idempotency check: If already confirmed, return existing ticket immediately
    if booking.status == 'CONFIRMED' and hasattr(booking, 'ticket'):
        return Response({
            'message': 'Booking already confirmed',
            'booking': BookingSerializer(booking).data,
            'ticket': TicketSerializer(booking.ticket).data
        })

    payment_status = request.data.get('status', 'SUCCESS') # 'SUCCESS' or 'FAILED'
    gateway_payment_id = request.data.get('gateway_payment_id', f"pay_{uuid.uuid4().hex[:14]}")
    gateway_signature = request.data.get('gateway_signature', '')

    with transaction.atomic():
        # If user/gateway simulated or reported payment failed
        if payment_status != 'SUCCESS':
            booking.status = 'FAILED'
            booking.save()
            payment.status = 'FAILED'
            payment.save()
            # Release any seat holds
            SeatHold.objects.filter(show=booking.show, user=request.user).delete()
            return Response({'error': 'Payment failed or was cancelled by user'}, status=status.HTTP_400_BAD_REQUEST)

        # In real Razorpay mode, verify signature
        if not payment.is_simulated and gateway_signature:
            valid = verify_razorpay_signature(payment.gateway_order_id, gateway_payment_id, gateway_signature)
            if not valid:
                PaymentEvent.objects.create(
                    payment=payment,
                    event_type='SIGNATURE_FAILED',
                    payload={'order_id': payment.gateway_order_id, 'payment_id': gateway_payment_id}
                )
                return Response({'error': 'Payment signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark Payment completed
        payment.status = 'COMPLETED'
        payment.gateway_payment_id = gateway_payment_id
        payment.gateway_signature = gateway_signature
        payment.save()

        # Mark Booking confirmed
        booking.status = 'CONFIRMED'
        booking.save()

        # Release temporary holds since seats are now permanently confirmed in BookingSeat
        SeatHold.objects.filter(show=booking.show, user=request.user).delete()

        # Generate QR E-Ticket
        ticket_number = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        verification_token = generate_secure_token()
        
        # Opaque payload inside QR code
        qr_payload = json.dumps({
            "ticket": ticket_number,
            "token": verification_token,
            "ref": booking.booking_reference
        })
        qr_image = generate_qr_code_base64(qr_payload)

        ticket, _ = Ticket.objects.get_or_create(
            booking=booking,
            defaults={
                'ticket_number': ticket_number,
                'verification_token': verification_token,
                'qr_code_image': qr_image,
                'status': 'VALID'
            }
        )

        PaymentEvent.objects.create(
            payment=payment,
            event_type='PAYMENT_CONFIRMED',
            payload={'ticket_number': ticket_number, 'amount': str(payment.amount)}
        )

    return Response({
        'message': 'Booking confirmed and E-Ticket generated successfully!',
        'booking': BookingSerializer(booking).data,
        'ticket': TicketSerializer(ticket).data
    })


# ==============================================================================
# CUSTOMER DASHBOARD & TICKET RETRIEVAL
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_bookings_view(request):
    """
    Returns authenticated user's booking history.
    """
    bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
    return Response(BookingSerializer(bookings, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def booking_detail_view(request, booking_ref):
    """
    Returns full booking and ticket details.
    """
    try:
        booking = Booking.objects.get(booking_reference=booking_ref)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    # Permission check: booking owner or staff or admin
    if booking.user != request.user and not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.role in ['STAFF', 'ADMIN']):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking_view(request, booking_ref):
    """
    Cancels a confirmed booking, releases reserved seats atomically,
    records refund status, and prevents double-cancellations.
    """
    with transaction.atomic():
        try:
            booking = Booking.objects.select_for_update().select_related(
                'show__movie', 'show__screen__theatre', 'payment'
            ).get(booking_reference=booking_ref, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status == 'CANCELLED':
            return Response({
                'error': 'This booking has already been cancelled.',
                'can_cancel': False
            }, status=status.HTTP_400_BAD_REQUEST)

        if booking.status != 'CONFIRMED':
            return Response({
                'error': f'Only confirmed bookings can be cancelled (Current status: {booking.status}).',
                'can_cancel': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Cutoff check: Prevent cancelling past, ongoing, or within-cutoff shows
        now = timezone.now()
        show_dt = timezone.make_aware(datetime.datetime.combine(booking.show.date, booking.show.start_time))
        cutoff_hours = getattr(settings, 'CANCELLATION_CUTOFF_HOURS', 2)
        cutoff_time = show_dt - datetime.timedelta(hours=cutoff_hours)

        if now > show_dt:
            return Response({
                'error': 'Cannot cancel past or ongoing shows. Showtime has already started or concluded.',
                'can_cancel': False
            }, status=status.HTTP_400_BAD_REQUEST)

        if now > cutoff_time:
            return Response({
                'error': f'Cancellation deadline exceeded. Cancellations are only permitted up to {cutoff_hours} hours prior to showtime (Cutoff was {cutoff_time.strftime("%I:%M %p, %d %b %Y")}).',
                'can_cancel': False,
                'cutoff_time': cutoff_time.isoformat()
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark booking cancelled
        booking.status = 'CANCELLED'
        booking.save()

        # Delete booked seats so seats become available immediately for other customers
        released_seats_count = booking.booking_seats.count()
        booking.booking_seats.all().delete()

        # Cancel ticket
        if hasattr(booking, 'ticket') and booking.ticket:
            booking.ticket.status = 'CANCELLED'
            booking.ticket.save()

        # Record refund and create audit event
        refund_amount = booking.base_amount
        refund_reference = f"ref_{uuid.uuid4().hex[:10]}"
        is_simulated = True

        if hasattr(booking, 'payment') and booking.payment:
            payment = booking.payment
            is_simulated = payment.is_simulated
            payment.status = 'REFUNDED'
            payment.save()

            PaymentEvent.objects.create(
                payment=payment,
                event_type='REFUND_PROCESSED',
                payload={
                    'booking_reference': booking.booking_reference,
                    'refund_amount': str(refund_amount),
                    'refund_reference': refund_reference,
                    'is_simulated': is_simulated,
                    'released_seats_count': released_seats_count,
                    'timestamp': now.isoformat()
                }
            )

        refund_status_label = 'SIMULATED_REFUND_COMPLETED' if is_simulated else 'REFUND_PROCESSED'

        return Response({
            'message': 'Booking cancelled successfully. Your seats have been released.',
            'booking_reference': booking.booking_reference,
            'status': 'CANCELLED',
            'released_seats_count': released_seats_count,
            'refund_status': refund_status_label,
            'refund_amount': float(refund_amount),
            'refund_reference': refund_reference,
            'is_simulated': is_simulated
        })


# ==============================================================================
# THEATRE STAFF PORTAL & QR SCANNER
# ==============================================================================

@api_view(['POST'])
@permission_classes([IsTheatreStaff])
def staff_verify_ticket_view(request):
    """
    Authoritative ticket verification by assigned theatre staff.
    Atomic verification:
    - Checks token validity
    - Ensures ticket belongs to staff member's assigned theatre
    - Atomic redemption check: prevents duplicate scans/entry
    - Returns GREEN success or RED denial with complete reasons.
    """
    raw_input = request.data.get('token', '').strip()
    if not raw_input:
        return Response({'error': 'QR Code token or ticket number required'}, status=status.HTTP_400_BAD_REQUEST)

    # Parse raw input: could be JSON string from QR or bare token string or ticket number
    token_str = raw_input
    ticket_num = None
    if raw_input.startswith('{') and raw_input.endswith('}'):
        try:
            parsed = json.loads(raw_input)
            token_str = parsed.get('token', '')
            ticket_num = parsed.get('ticket', None)
        except Exception:
            pass

    staff_user = request.user
    staff_theatre = getattr(getattr(staff_user, 'profile', None), 'theatre', None)

    with transaction.atomic():
        # Find ticket using row-level locking (select_for_update)
        ticket_qs = Ticket.objects.select_for_update().select_related(
            'booking__show__movie',
            'booking__show__screen__theatre',
            'booking__user'
        )

        ticket = None
        if token_str:
            ticket = ticket_qs.filter(verification_token=token_str).first()
        if not ticket and ticket_num:
            ticket = ticket_qs.filter(ticket_number=ticket_num).first()
        if not ticket and raw_input:
            ticket = ticket_qs.filter(ticket_number=raw_input).first()

        # 1. Invalid Token / Not Found
        if not ticket:
            if staff_theatre:
                # Log scan attempt if theatre exists
                pass
            return Response({
                'is_valid': False,
                'scan_result': 'INVALID_TOKEN',
                'badge_color': 'red',
                'title': 'INVALID TICKET — ENTRY DENIED',
                'reason': 'Ticket token or code was not found in the CineBook system.'
            }, status=status.HTTP_400_BAD_REQUEST)

        show = ticket.booking.show
        ticket_theatre = show.screen.theatre
        movie = show.movie
        customer = ticket.booking.user

        # 2. Cancelled or Unpaid
        if ticket.booking.status != 'CONFIRMED' or ticket.status == 'CANCELLED':
            TicketScan.objects.create(
                ticket=ticket,
                scanned_by=staff_user,
                theatre=staff_theatre or ticket_theatre,
                scan_result='CANCELLED_OR_UNPAID',
                message='Ticket belongs to a cancelled or unpaid booking.'
            )
            return Response({
                'is_valid': False,
                'scan_result': 'CANCELLED_OR_UNPAID',
                'badge_color': 'red',
                'title': 'INVALID TICKET — ENTRY DENIED',
                'reason': f"This ticket is {ticket.status.lower()} (Booking status: {ticket.booking.status}).",
                'ticket_number': ticket.ticket_number
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Theatre Verification: Staff must be authorized for this theatre
        if staff_theatre and staff_theatre != ticket_theatre and not staff_user.is_superuser:
            TicketScan.objects.create(
                ticket=ticket,
                scanned_by=staff_user,
                theatre=staff_theatre,
                scan_result='INVALID_THEATRE',
                message=f"Ticket belongs to {ticket_theatre.name}, not {staff_theatre.name}."
            )
            return Response({
                'is_valid': False,
                'scan_result': 'INVALID_THEATRE',
                'badge_color': 'red',
                'title': 'INVALID THEATRE — ENTRY DENIED',
                'reason': f"This ticket was issued for '{ticket_theatre.name}'. Access denied at '{staff_theatre.name}'.",
                'ticket_theatre': ticket_theatre.name,
                'staff_theatre': staff_theatre.name,
                'ticket_number': ticket.ticket_number
            }, status=status.HTTP_403_FORBIDDEN)

        # 4. Already Redeemed Check (Atomic)
        if ticket.status == 'REDEEMED':
            prev_time_str = ticket.redeemed_at.strftime('%I:%M %p on %d %b %Y') if ticket.redeemed_at else 'Earlier'
            prev_scanner = ticket.redeemed_by.username if ticket.redeemed_by else 'Staff'
            
            TicketScan.objects.create(
                ticket=ticket,
                scanned_by=staff_user,
                theatre=staff_theatre or ticket_theatre,
                scan_result='ALREADY_USED',
                message=f"Ticket was already redeemed at {prev_time_str} by {prev_scanner}."
            )
            return Response({
                'is_valid': False,
                'scan_result': 'ALREADY_USED',
                'badge_color': 'red',
                'title': 'TICKET ALREADY USED — ENTRY DENIED',
                'reason': f"This ticket has already been used for entry at {prev_time_str} by {prev_scanner}.",
                'redeemed_at': ticket.redeemed_at.isoformat() if ticket.redeemed_at else None,
                'redeemed_by': prev_scanner,
                'ticket_number': ticket.ticket_number,
                'movie_title': movie.title
            }, status=status.HTTP_409_CONFLICT)

        # 5. Ticket is VALID: Mark as redeemed atomically
        now = timezone.now()
        ticket.status = 'REDEEMED'
        ticket.redeemed_at = now
        ticket.redeemed_by = staff_user
        ticket.save()

        # Log scan event
        TicketScan.objects.create(
            ticket=ticket,
            scanned_by=staff_user,
            theatre=staff_theatre or ticket_theatre,
            scan_result='VERIFIED',
            message='Ticket verified successfully. Entry granted.'
        )

        seats_list = [f"{bs.seat.seat_label} ({bs.category})" for bs in ticket.booking.booking_seats.all()]

        return Response({
            'is_valid': True,
            'scan_result': 'VERIFIED',
            'badge_color': 'green',
            'title': 'TICKET VERIFIED — ENTRY ALLOWED',
            'message': 'Welcome to CineBook! Enjoy the movie.',
            'ticket_number': ticket.ticket_number,
            'booking_reference': ticket.booking.booking_reference,
            'movie_title': movie.title,
            'certification': movie.certification,
            'language': movie.language,
            'theatre_name': ticket_theatre.name,
            'screen_name': show.screen.name,
            'show_date': show.date.isoformat(),
            'show_time': show.start_time.strftime('%I:%M %p'),
            'seats': seats_list,
            'customer_name': customer.get_full_name() or customer.username,
            'checked_in_at': now.strftime('%I:%M:%S %p'),
            'staff_name': staff_user.get_full_name() or staff_user.username
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsTheatreStaff])
def staff_scan_logs_view(request):
    """
    Returns recent check-in logs for staff's theatre.
    """
    staff_user = request.user
    staff_theatre = getattr(getattr(staff_user, 'profile', None), 'theatre', None)

    qs = TicketScan.objects.all().select_related(
        'ticket__booking__show__movie',
        'scanned_by',
        'theatre'
    )
    if staff_theatre and not staff_user.is_superuser:
        qs = qs.filter(theatre=staff_theatre)

    ref = request.query_params.get('ref')
    if ref:
        qs = qs.filter(ticket__booking__booking_reference__icontains=ref)

    return Response(TicketScanSerializer(qs[:50], many=True).data)


# ==============================================================================
# PLATFORM ADMIN DASHBOARD & ANALYTICS
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsPlatformAdmin])
def admin_metrics_view(request):
    """
    Aggregated metrics for admin analytics.
    """
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='CONFIRMED')
    total_revenue = sum((b.grand_total for b in confirmed_bookings), Decimal('0.00'))
    total_tickets_sold = sum((b.total_tickets for b in confirmed_bookings), 0)

    # Active movies & shows
    active_shows = Show.objects.filter(is_active=True).count()
    active_movies = Movie.objects.filter(status='NOW_SHOWING').count()

    # Recent bookings
    recent_bookings = Booking.objects.order_by('-created_at')[:10]

    return Response({
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings.count(),
        'total_revenue': float(total_revenue),
        'total_tickets_sold': total_tickets_sold,
        'active_shows': active_shows,
        'active_movies': active_movies,
        'recent_bookings': BookingSerializer(recent_bookings, many=True).data
    })

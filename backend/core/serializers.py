from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, City, Theatre, Screen, Seat,
    Movie, Show, SeatHold, Booking, BookingSeat,
    Payment, PaymentEvent, Ticket, TicketScan
)


class UserProfileSerializer(serializers.ModelSerializer):
    theatre_name = serializers.CharField(source='theatre.name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'theatre', 'theatre_name']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default='CUSTOMER', required=False)
    phone = serializers.CharField(max_length=20, required=False, default='')
    theatre_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'theatre_id']

    def create(self, validated_data):
        role = validated_data.pop('role', 'CUSTOMER')
        phone = validated_data.pop('phone', '')
        theatre_id = validated_data.pop('theatre_id', None)
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        theatre = None
        if theatre_id:
            try:
                theatre = Theatre.objects.get(id=theatre_id)
            except Theatre.DoesNotExist:
                pass

        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            theatre=theatre
        )
        return user


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'


class ScreenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Screen
        fields = ['id', 'theatre', 'name', 'sound_type', 'total_capacity']


class TheatreSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    screens = ScreenSerializer(many=True, read_only=True)

    class Meta:
        model = Theatre
        fields = ['id', 'city', 'city_name', 'name', 'address', 'landmark', 'is_demo', 'is_active', 'screens']


class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ['id', 'screen', 'row', 'number', 'seat_label', 'category']


class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'


class ShowSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)
    movie_id = serializers.PrimaryKeyRelatedField(queryset=Movie.objects.all(), source='movie', write_only=True)
    screen_name = serializers.CharField(source='screen.name', read_only=True)
    theatre_id = serializers.IntegerField(source='screen.theatre.id', read_only=True)
    theatre_name = serializers.CharField(source='screen.theatre.name', read_only=True)
    city_id = serializers.IntegerField(source='screen.theatre.city.id', read_only=True)
    city_name = serializers.CharField(source='screen.theatre.city.name', read_only=True)
    sound_type = serializers.CharField(source='screen.sound_type', read_only=True)

    class Meta:
        model = Show
        fields = [
            'id', 'movie', 'movie_id', 'screen', 'screen_name',
            'theatre_id', 'theatre_name', 'city_id', 'city_name',
            'sound_type', 'date', 'start_time', 'end_time',
            'price_regular', 'price_premium', 'price_recliner', 'is_active'
        ]


class BookingSeatSerializer(serializers.ModelSerializer):
    seat_label = serializers.CharField(source='seat.seat_label', read_only=True)
    row = serializers.CharField(source='seat.row', read_only=True)
    number = serializers.IntegerField(source='seat.number', read_only=True)

    class Meta:
        model = BookingSeat
        fields = ['id', 'seat', 'seat_label', 'row', 'number', 'category', 'price']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_method', 'transaction_id', 'gateway_order_id',
            'gateway_payment_id', 'amount', 'currency', 'status', 'is_simulated', 'created_at'
        ]


class TicketSerializer(serializers.ModelSerializer):
    redeemed_by_username = serializers.CharField(source='redeemed_by.username', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'verification_token', 'token_hash',
            'qr_code_image', 'status', 'issued_at', 'redeemed_at', 'redeemed_by_username'
        ]


class BookingSerializer(serializers.ModelSerializer):
    booking_seats = BookingSeatSerializer(many=True, read_only=True)
    show = ShowSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    ticket = TicketSerializer(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    can_cancel = serializers.SerializerMethodField()
    cancellation_reason = serializers.SerializerMethodField()
    cancellation_deadline = serializers.SerializerMethodField()
    estimated_refund = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'user_name', 'user_email',
            'show', 'total_tickets', 'base_amount', 'convenience_fee',
            'tax_amount', 'grand_total', 'status', 'booking_seats',
            'payment', 'ticket', 'can_cancel', 'cancellation_reason',
            'cancellation_deadline', 'estimated_refund', 'created_at', 'updated_at'
        ]

    def get_can_cancel(self, obj):
        if obj.status != 'CONFIRMED':
            return False
        from django.utils import timezone
        from django.conf import settings
        import datetime
        now = timezone.now()
        show_dt = timezone.make_aware(datetime.datetime.combine(obj.show.date, obj.show.start_time))
        cutoff_hours = getattr(settings, 'CANCELLATION_CUTOFF_HOURS', 2)
        cutoff_time = show_dt - datetime.timedelta(hours=cutoff_hours)
        return now <= cutoff_time

    def get_cancellation_reason(self, obj):
        if obj.status == 'CANCELLED':
            return 'Booking has already been cancelled.'
        if obj.status != 'CONFIRMED':
            return f'Only confirmed bookings can be cancelled (Current status: {obj.status}).'
        from django.utils import timezone
        from django.conf import settings
        import datetime
        now = timezone.now()
        show_dt = timezone.make_aware(datetime.datetime.combine(obj.show.date, obj.show.start_time))
        cutoff_hours = getattr(settings, 'CANCELLATION_CUTOFF_HOURS', 2)
        cutoff_time = show_dt - datetime.timedelta(hours=cutoff_hours)
        if now > show_dt:
            return 'Cannot cancel past or ongoing shows.'
        if now > cutoff_time:
            return f'Cancellation window closed {cutoff_hours} hours prior to showtime.'
        return None

    def get_cancellation_deadline(self, obj):
        import datetime
        from django.utils import timezone
        from django.conf import settings
        show_dt = timezone.make_aware(datetime.datetime.combine(obj.show.date, obj.show.start_time))
        cutoff_hours = getattr(settings, 'CANCELLATION_CUTOFF_HOURS', 2)
        return (show_dt - datetime.timedelta(hours=cutoff_hours)).isoformat()

    def get_estimated_refund(self, obj):
        return float(obj.base_amount)


class TicketScanSerializer(serializers.ModelSerializer):
    ticket_number = serializers.CharField(source='ticket.ticket_number', read_only=True)
    scanned_by_username = serializers.CharField(source='scanned_by.username', read_only=True)
    theatre_name = serializers.CharField(source='theatre.name', read_only=True)
    movie_title = serializers.CharField(source='ticket.booking.show.movie.title', read_only=True)
    show_time = serializers.SerializerMethodField()

    class Meta:
        model = TicketScan
        fields = [
            'id', 'ticket', 'ticket_number', 'scanned_by_username',
            'theatre_name', 'movie_title', 'show_time',
            'scan_result', 'message', 'scanned_at'
        ]

    def get_show_time(self, obj):
        show = obj.ticket.booking.show
        return f"{show.date} {show.start_time.strftime('%I:%M %p')}"

import uuid
import hashlib
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('STAFF', 'Theatre Staff'),
        ('ADMIN', 'Platform Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    phone = models.CharField(max_length=20, blank=True, default='')
    # For staff users, assigned theatre
    theatre = models.ForeignKey(
        'Theatre', null=True, blank=True, on_delete=models.SET_NULL, related_name='staff_members'
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class City(models.Model):
    name = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=100, default='Telangana')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Cities'
        ordering = ['name']

    def __str__(self):
        return self.name


class Theatre(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='theatres')
    name = models.CharField(max_length=200)
    address = models.TextField()
    landmark = models.CharField(max_length=200, blank=True, default='')
    is_demo = models.BooleanField(default=True, help_text="Designates this as a demo venue, not real")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.city.name}"


class Screen(models.Model):
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='screens')
    name = models.CharField(max_length=100)
    sound_type = models.CharField(max_length=100, default='Dolby Atmos 7.1')
    total_capacity = models.PositiveIntegerField(default=64)

    class Meta:
        unique_together = ('theatre', 'name')

    def __str__(self):
        return f"{self.theatre.name} - {self.name}"


class Seat(models.Model):
    CATEGORY_CHOICES = [
        ('REGULAR', 'Regular'),
        ('PREMIUM', 'Premium'),
        ('RECLINER', 'Recliner'),
    ]
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='seats')
    row = models.CharField(max_length=5)       # e.g., 'A', 'B'
    number = models.PositiveIntegerField()     # e.g., 1, 2, ...
    seat_label = models.CharField(max_length=10) # e.g., 'A1', 'C4'
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='REGULAR')

    class Meta:
        unique_together = ('screen', 'row', 'number')
        ordering = ['row', 'number']

    def __str__(self):
        return f"{self.screen.name} | {self.seat_label} ({self.category})"


class Movie(models.Model):
    STATUS_CHOICES = [
        ('NOW_SHOWING', 'Now Showing'),
        ('COMING_SOON', 'Coming Soon'),
        ('ARCHIVED', 'Archived'),
    ]
    title = models.CharField(max_length=200)
    synopsis = models.TextField()
    genre = models.CharField(max_length=100)
    language = models.CharField(max_length=50)
    duration_minutes = models.PositiveIntegerField()
    release_date = models.DateField()
    certification = models.CharField(max_length=10, default='U/A')
    poster_url = models.URLField(max_length=1000)
    backdrop_url = models.URLField(max_length=1000, blank=True)
    trailer_url = models.URLField(max_length=1000, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal('8.5'))
    cast = models.TextField(blank=True, default='')
    director = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOW_SHOWING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-release_date', 'title']

    def __str__(self):
        return f"{self.title} ({self.language})"


class Show(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='shows')
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='shows')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    price_regular = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('150.00'))
    price_premium = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('250.00'))
    price_recliner = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('350.00'))
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.movie.title} @ {self.screen} on {self.date} {self.start_time.strftime('%I:%M %p')}"

    def get_price_for_category(self, category):
        if category == 'RECLINER':
            return self.price_recliner
        elif category == 'PREMIUM':
            return self.price_premium
        return self.price_regular


class SeatHold(models.Model):
    """
    Temporary hold on a seat while customer is in checkout/payment flow.
    Releases after expiry (e.g. 5 minutes).
    """
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='seat_holds')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='holds')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='seat_holds')
    session_id = models.CharField(max_length=128, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        unique_together = ('show', 'seat')

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Hold: {self.seat.seat_label} for {self.show.id} (exp: {self.expires_at})"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
        ('FAILED', 'Failed'),
    ]
    booking_reference = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='bookings')
    total_tickets = models.PositiveIntegerField(default=1)
    base_amount = models.DecimalField(max_digits=10, decimal_places=2)
    convenience_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('30.00'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('5.40'))
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking {self.booking_reference} - {self.status} (₹{self.grand_total})"


class BookingSeat(models.Model):
    """
    Confirmed/locked seats associated with a booking.
    The unique constraint on ('show', 'seat') prevents double booking.
    """
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_seats')
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='booked_seats')
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='booking_seats')
    category = models.CharField(max_length=20)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        unique_together = ('show', 'seat')

    def __str__(self):
        return f"{self.seat.seat_label} ({self.booking.booking_reference})"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=50, default='RAZORPAY_TEST')
    transaction_id = models.CharField(max_length=128, unique=True)
    gateway_order_id = models.CharField(max_length=128, blank=True, default='')
    gateway_payment_id = models.CharField(max_length=128, blank=True, default='')
    gateway_signature = models.CharField(max_length=256, blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    is_simulated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.status} (₹{self.amount})"


class PaymentEvent(models.Model):
    payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.SET_NULL, related_name='events')
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PaymentEvent {self.event_type} @ {self.created_at}"


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('VALID', 'Valid / Active'),
        ('REDEEMED', 'Redeemed / Checked-in'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    ]
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='ticket')
    ticket_number = models.CharField(max_length=32, unique=True)
    verification_token = models.CharField(max_length=128, unique=True, db_index=True)
    token_hash = models.CharField(max_length=128, blank=True)
    qr_code_image = models.TextField(help_text="Base64 Data URI of QR code image")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='VALID')
    issued_at = models.DateTimeField(auto_now_add=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    redeemed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='redeemed_tickets'
    )

    def save(self, *args, **kwargs):
        if not self.token_hash and self.verification_token:
            self.token_hash = hashlib.sha256(self.verification_token.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.status}"


class TicketScan(models.Model):
    RESULT_CHOICES = [
        ('VERIFIED', 'Ticket Verified — Entry Allowed'),
        ('ALREADY_USED', 'Ticket Already Used — Entry Denied'),
        ('INVALID_THEATRE', 'Invalid Theatre — Entry Denied'),
        ('INVALID_SHOW', 'Invalid Show — Entry Denied'),
        ('CANCELLED_OR_UNPAID', 'Cancelled or Unpaid Ticket — Entry Denied'),
        ('INVALID_TOKEN', 'Invalid Ticket — Entry Denied'),
    ]
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='scan_logs')
    scanned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scans_performed')
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='ticket_scans')
    scan_result = models.CharField(max_length=30, choices=RESULT_CHOICES)
    message = models.CharField(max_length=255)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']

    def __str__(self):
        return f"Scan {self.ticket.ticket_number} -> {self.scan_result} at {self.scanned_at}"

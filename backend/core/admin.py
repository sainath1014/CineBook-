from django.contrib import admin
from .models import (
    UserProfile, City, Theatre, Screen, Seat,
    Movie, Show, SeatHold, Booking, BookingSeat,
    Payment, PaymentEvent, Ticket, TicketScan
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'theatre', 'phone')
    list_filter = ('role', 'theatre')
    search_fields = ('user__username', 'user__email', 'phone')


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'state', 'is_active')
    list_filter = ('is_active',)


@admin.register(Theatre)
class TheatreAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'landmark', 'is_demo', 'is_active')
    list_filter = ('city', 'is_demo', 'is_active')
    search_fields = ('name', 'address')


@admin.register(Screen)
class ScreenAdmin(admin.ModelAdmin):
    list_display = ('name', 'theatre', 'sound_type', 'total_capacity')
    list_filter = ('theatre__city', 'theatre')


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('seat_label', 'screen', 'row', 'number', 'category')
    list_filter = ('screen__theatre', 'category', 'row')


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'language', 'genre', 'duration_minutes', 'rating', 'status', 'release_date')
    list_filter = ('status', 'language', 'genre')
    search_fields = ('title', 'cast', 'director')


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ('movie', 'screen', 'date', 'start_time', 'end_time', 'price_regular', 'is_active')
    list_filter = ('date', 'screen__theatre', 'is_active')
    search_fields = ('movie__title', 'screen__name')


@admin.register(SeatHold)
class SeatHoldAdmin(admin.ModelAdmin):
    list_display = ('show', 'seat', 'user', 'session_id', 'created_at', 'expires_at')
    list_filter = ('show', 'created_at')


class BookingSeatInline(admin.TabularInline):
    model = BookingSeat
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_reference', 'user', 'show', 'total_tickets', 'grand_total', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('booking_reference', 'user__username', 'user__email')
    inlines = [BookingSeatInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'booking', 'payment_method', 'amount', 'status', 'is_simulated', 'created_at')
    list_filter = ('status', 'payment_method', 'is_simulated')
    search_fields = ('transaction_id', 'gateway_order_id', 'gateway_payment_id')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'booking', 'status', 'issued_at', 'redeemed_at', 'redeemed_by')
    list_filter = ('status', 'issued_at', 'redeemed_at')
    search_fields = ('ticket_number', 'verification_token', 'booking__booking_reference')


@admin.register(TicketScan)
class TicketScanAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'theatre', 'scanned_by', 'scan_result', 'scanned_at')
    list_filter = ('scan_result', 'theatre', 'scanned_at')
    search_fields = ('ticket__ticket_number', 'scanned_by__username')

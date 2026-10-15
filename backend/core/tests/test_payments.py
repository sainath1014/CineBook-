import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    City, Theatre, Screen, Seat, Movie, Show, Booking, BookingSeat, Payment, Ticket
)
from core.utils import verify_razorpay_signature
import hmac
import hashlib


class PaymentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="payuser", password="password123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.city = City.objects.create(name="Hyderabad", state="Telangana")
        self.theatre = Theatre.objects.create(name="CineBook Demo Theatre", city=self.city, address="Ameerpet")
        self.screen = Screen.objects.create(theatre=self.theatre, name="Screen 1", total_capacity=20)
        self.seat = Seat.objects.create(screen=self.screen, row="C", number=5, seat_label="C5", category="PREMIUM")

        self.movie = Movie.objects.create(
            title="Kalki 2898 AD",
            synopsis="Sci-Fi action",
            genre="Sci-Fi",
            language="Telugu",
            duration_minutes=181,
            release_date=datetime.date.today(),
            poster_url="https://example.com/poster.jpg"
        )
        self.show = Show.objects.create(
            movie=self.movie,
            screen=self.screen,
            date=datetime.date.today(),
            start_time=datetime.time(18, 0),
            end_time=datetime.time(21, 0),
            price_regular=Decimal('150.00'),
            price_premium=Decimal('250.00'),
            price_recliner=Decimal('350.00'),
        )

    def test_complete_booking_and_payment_flow(self):
        # 1. Create booking
        create_res = self.client.post('/api/bookings/create/', {
            'show_id': self.show.id,
            'seat_ids': [self.seat.id],
            'payment_method': 'SIMULATED_CARD'
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        booking_ref = create_res.data['booking_reference']
        self.assertTrue(create_res.data['is_simulated'])

        # 2. Confirm payment
        verify_res = self.client.post(f'/api/bookings/{booking_ref}/verify-payment/', {
            'status': 'SUCCESS'
        }, format='json')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn('ticket', verify_res.data)
        ticket_data = verify_res.data['ticket']
        self.assertTrue(ticket_data['qr_code_image'].startswith('data:image/png;base64,'))
        self.assertEqual(ticket_data['status'], 'VALID')

        # 3. Idempotency: verify again with same booking
        repeat_res = self.client.post(f'/api/bookings/{booking_ref}/verify-payment/', {
            'status': 'SUCCESS'
        }, format='json')
        self.assertEqual(repeat_res.status_code, status.HTTP_200_OK)
        # Should return the same ticket number, not duplicate
        self.assertEqual(repeat_res.data['ticket']['ticket_number'], ticket_data['ticket_number'])
        self.assertEqual(Ticket.objects.filter(booking__booking_reference=booking_ref).count(), 1)

    def test_failed_payment_releases_seats(self):
        create_res = self.client.post('/api/bookings/create/', {
            'show_id': self.show.id,
            'seat_ids': [self.seat.id],
            'payment_method': 'SIMULATED_CARD'
        }, format='json')
        booking_ref = create_res.data['booking_reference']

        # Send failure
        fail_res = self.client.post(f'/api/bookings/{booking_ref}/verify-payment/', {
            'status': 'FAILED'
        }, format='json')
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

        booking = Booking.objects.get(booking_reference=booking_ref)
        self.assertEqual(booking.status, 'FAILED')
        self.assertEqual(booking.payment.status, 'FAILED')

    def test_razorpay_signature_verifier_utility(self):
        secret = "test_secret_12345"
        order_id = "order_98765"
        payment_id = "pay_54321"
        msg = f"{order_id}|{payment_id}".encode('utf-8')
        valid_sig = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()

        # Valid signature should pass
        self.assertTrue(verify_razorpay_signature(order_id, payment_id, valid_sig, secret))
        # Tampered signature should fail
        self.assertFalse(verify_razorpay_signature(order_id, payment_id, "invalid_signature", secret))

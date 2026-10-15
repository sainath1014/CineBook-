import json
import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    UserProfile, City, Theatre, Screen, Seat, Movie, Show, Booking, BookingSeat, Payment, Ticket
)
from core.utils import generate_secure_token, generate_qr_code_base64


class QRScannerTests(TestCase):
    def setUp(self):
        # 1. Cities & Theatres
        self.city = City.objects.create(name="Hyderabad", state="Telangana")
        self.theatre_ameerpet = Theatre.objects.create(
            name="CineBook Demo Theatre — Ameerpet",
            city=self.city,
            address="Ameerpet, Hyderabad"
        )
        self.theatre_kukatpally = Theatre.objects.create(
            name="CineBook Demo Theatre — Kukatpally",
            city=self.city,
            address="Kukatpally, Hyderabad"
        )

        # 2. Staff users
        self.staff_ameerpet = User.objects.create_user(username="staff_ameerpet", password="password123")
        UserProfile.objects.create(user=self.staff_ameerpet, role="STAFF", theatre=self.theatre_ameerpet)

        self.staff_kukatpally = User.objects.create_user(username="staff_kukatpally", password="password123")
        UserProfile.objects.create(user=self.staff_kukatpally, role="STAFF", theatre=self.theatre_kukatpally)

        self.customer = User.objects.create_user(username="normal_cust", password="password123")
        UserProfile.objects.create(user=self.customer, role="CUSTOMER")

        # 3. Screen, Movie, Show at Ameerpet
        self.screen_ameerpet = Screen.objects.create(
            theatre=self.theatre_ameerpet,
            name="Screen 1 IMAX",
            total_capacity=50
        )
        self.seat = Seat.objects.create(
            screen=self.screen_ameerpet,
            row="C",
            number=3,
            seat_label="C3",
            category="PREMIUM"
        )
        self.movie = Movie.objects.create(
            title="Avengers: Infinity War",
            synopsis="Action movie",
            genre="Action",
            language="English",
            duration_minutes=149,
            release_date=datetime.date.today(),
            poster_url="https://example.com/poster.jpg"
        )
        self.show = Show.objects.create(
            movie=self.movie,
            screen=self.screen_ameerpet,
            date=datetime.date.today(),
            start_time=datetime.time(13, 45),
            end_time=datetime.time(16, 15),
            price_regular=Decimal('150.00'),
            price_premium=Decimal('250.00'),
            price_recliner=Decimal('350.00'),
        )

        # 4. Confirmed booking and valid Ticket
        self.booking = Booking.objects.create(
            booking_reference="CB-20261015-SCAN01",
            user=self.customer,
            show=self.show,
            total_tickets=1,
            base_amount=Decimal('250.00'),
            convenience_fee=Decimal('30.00'),
            tax_amount=Decimal('5.40'),
            grand_total=Decimal('285.40'),
            status="CONFIRMED"
        )
        BookingSeat.objects.create(
            booking=self.booking,
            show=self.show,
            seat=self.seat,
            category="PREMIUM",
            price=Decimal('250.00')
        )
        self.token = generate_secure_token()
        self.ticket = Ticket.objects.create(
            booking=self.booking,
            ticket_number="TKT-SCAN01",
            verification_token=self.token,
            qr_code_image=generate_qr_code_base64(self.token),
            status="VALID"
        )

        self.client_ameerpet = APIClient()
        self.client_ameerpet.force_authenticate(user=self.staff_ameerpet)

    def test_first_scan_verifies_and_grants_entry(self):
        # Staff scans valid ticket token
        res = self.client_ameerpet.post('/api/staff/verify-ticket/', {
            'token': self.token
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_valid'])
        self.assertEqual(res.data['scan_result'], 'VERIFIED')
        self.assertEqual(res.data['badge_color'], 'green')
        self.assertIn('TICKET VERIFIED — ENTRY ALLOWED', res.data['title'])
        self.assertEqual(res.data['movie_title'], 'Avengers: Infinity War')
        self.assertEqual(res.data['ticket_number'], 'TKT-SCAN01')

        # Verify ticket in database is now REDEEMED
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, 'REDEEMED')
        self.assertIsNotNone(self.ticket.redeemed_at)
        self.assertEqual(self.ticket.redeemed_by, self.staff_ameerpet)

    def test_second_scan_rejected_as_already_used(self):
        # First scan
        first_res = self.client_ameerpet.post('/api/staff/verify-ticket/', {'token': self.token}, format='json')
        self.assertEqual(first_res.status_code, status.HTTP_200_OK)

        # Second scan of the same ticket must be denied
        second_res = self.client_ameerpet.post('/api/staff/verify-ticket/', {'token': self.token}, format='json')
        self.assertEqual(second_res.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(second_res.data['is_valid'])
        self.assertEqual(second_res.data['scan_result'], 'ALREADY_USED')
        self.assertEqual(second_res.data['badge_color'], 'red')
        self.assertIn('TICKET ALREADY USED — ENTRY DENIED', second_res.data['title'])

    def test_scan_at_wrong_theatre_rejected(self):
        # Staff from Kukatpally attempts to scan Ameerpet ticket
        client_kukatpally = APIClient()
        client_kukatpally.force_authenticate(user=self.staff_kukatpally)

        res = client_kukatpally.post('/api/staff/verify-ticket/', {'token': self.token}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(res.data['is_valid'])
        self.assertEqual(res.data['scan_result'], 'INVALID_THEATRE')
        self.assertIn('INVALID THEATRE — ENTRY DENIED', res.data['title'])

    def test_customer_cannot_call_staff_verification(self):
        cust_client = APIClient()
        cust_client.force_authenticate(user=self.customer)

        res = cust_client.post('/api/staff/verify-ticket/', {'token': self.token}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_token_returns_entry_denied(self):
        res = self.client_ameerpet.post('/api/staff/verify-ticket/', {'token': 'completely_fake_token_123'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['is_valid'])
        self.assertEqual(res.data['scan_result'], 'INVALID_TOKEN')

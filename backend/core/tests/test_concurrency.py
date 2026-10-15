import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    City, Theatre, Screen, Seat, Movie, Show, Booking, BookingSeat
)


class ConcurrencyAndConstraintTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")
        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)
        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)

        self.city = City.objects.create(name="Hyderabad", state="Telangana")
        self.theatre = Theatre.objects.create(name="CineBook Demo Theatre", city=self.city, address="Ameerpet")
        self.screen = Screen.objects.create(theatre=self.theatre, name="Screen 1", total_capacity=20)
        self.seat = Seat.objects.create(screen=self.screen, row="C", number=4, seat_label="C4", category="PREMIUM")

        self.movie = Movie.objects.create(
            title="Inception",
            synopsis="Test synopsis",
            genre="Sci-Fi",
            language="English",
            duration_minutes=148,
            release_date=datetime.date.today(),
            poster_url="https://example.com/poster.jpg"
        )
        self.show = Show.objects.create(
            movie=self.movie,
            screen=self.screen,
            date=datetime.date.today(),
            start_time=datetime.time(18, 0),
            end_time=datetime.time(20, 30),
            price_regular=Decimal('150.00'),
            price_premium=Decimal('250.00'),
            price_recliner=Decimal('350.00'),
        )

    def test_database_unique_constraint_on_show_seat(self):
        booking1 = Booking.objects.create(
            booking_reference="CB-TEST-001",
            user=self.user1,
            show=self.show,
            total_tickets=1,
            base_amount=Decimal('250.00'),
            convenience_fee=Decimal('30.00'),
            tax_amount=Decimal('5.40'),
            grand_total=Decimal('285.40'),
            status="CONFIRMED"
        )
        BookingSeat.objects.create(
            booking=booking1,
            show=self.show,
            seat=self.seat,
            category=self.seat.category,
            price=Decimal('250.00')
        )

        # Attempting to insert a duplicate BookingSeat for the same (show, seat) must raise IntegrityError
        booking2 = Booking.objects.create(
            booking_reference="CB-TEST-002",
            user=self.user2,
            show=self.show,
            total_tickets=1,
            base_amount=Decimal('250.00'),
            convenience_fee=Decimal('30.00'),
            tax_amount=Decimal('5.40'),
            grand_total=Decimal('285.40'),
            status="PENDING"
        )
        with self.assertRaises(IntegrityError):
            BookingSeat.objects.create(
                booking=booking2,
                show=self.show,
                seat=self.seat,
                category=self.seat.category,
                price=Decimal('250.00')
            )

    def test_prevent_second_user_from_booking_already_confirmed_seat(self):
        # User 1 books and confirms seat
        create_res = self.client1.post('/api/bookings/create/', {
            'show_id': self.show.id,
            'seat_ids': [self.seat.id],
            'payment_method': 'SIMULATED_CARD'
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        ref = create_res.data['booking_reference']

        # Confirm User 1 payment
        verify_res = self.client1.post(f'/api/bookings/{ref}/verify-payment/', {
            'status': 'SUCCESS'
        }, format='json')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)

        # User 2 attempts to book the same seat -> must return 409 Conflict
        user2_res = self.client2.post('/api/bookings/create/', {
            'show_id': self.show.id,
            'seat_ids': [self.seat.id],
            'payment_method': 'SIMULATED_CARD'
        }, format='json')
        self.assertEqual(user2_res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('already booked', user2_res.data['error'])

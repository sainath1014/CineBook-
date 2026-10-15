import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    City, Theatre, Screen, Seat, Movie, Show, SeatHold, Booking, BookingSeat
)


class BookingAndSeatTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.client.force_authenticate(user=self.user)

        self.city = City.objects.create(name="Hyderabad", state="Telangana")
        self.theatre = Theatre.objects.create(name="CineBook Demo Theatre", city=self.city, address="Ameerpet")
        self.screen = Screen.objects.create(theatre=self.theatre, name="Screen 1", sound_type="Dolby Atmos", total_capacity=20)
        
        # Create seats: A1 (Recliner), C1 (Premium), F1 (Regular)
        self.seat_recliner = Seat.objects.create(screen=self.screen, row="A", number=1, seat_label="A1", category="RECLINER")
        self.seat_premium = Seat.objects.create(screen=self.screen, row="C", number=1, seat_label="C1", category="PREMIUM")
        self.seat_regular = Seat.objects.create(screen=self.screen, row="F", number=1, seat_label="F1", category="REGULAR")

        self.movie = Movie.objects.create(
            title="Avengers: Infinity War",
            synopsis="Test synopsis",
            genre="Action",
            language="English",
            duration_minutes=149,
            release_date=datetime.date.today(),
            poster_url="https://example.com/poster.jpg"
        )
        self.show = Show.objects.create(
            movie=self.movie,
            screen=self.screen,
            date=datetime.date.today() + datetime.timedelta(days=1),
            start_time=datetime.time(13, 45),
            end_time=datetime.time(16, 15),
            price_regular=Decimal('150.00'),
            price_premium=Decimal('250.00'),
            price_recliner=Decimal('350.00'),
        )

    def test_seat_availability_endpoint(self):
        res = self.client.get(f'/api/shows/{self.show.id}/seats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        seats = res.data['seats']
        self.assertEqual(len(seats), 3)
        for s in seats:
            self.assertEqual(s['status'], 'AVAILABLE')

    def test_seat_hold_and_expiry(self):
        # 1. Hold seats
        res = self.client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat_recliner.id, self.seat_premium.id]},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('expires_at', res.data)

        # 2. Check seat status from this user
        seat_res = self.client.get(f'/api/shows/{self.show.id}/seats/')
        for s in seat_res.data['seats']:
            if s['id'] in [self.seat_recliner.id, self.seat_premium.id]:
                self.assertEqual(s['status'], 'MY_HELD')

        # 3. From another user, seats should show as 'HELD'
        other_user = User.objects.create_user(username="otheruser", password="password123")
        other_client = APIClient()
        other_client.force_authenticate(user=other_user)
        other_res = other_client.get(f'/api/shows/{self.show.id}/seats/')
        for s in other_res.data['seats']:
            if s['id'] in [self.seat_recliner.id, self.seat_premium.id]:
                self.assertEqual(s['status'], 'HELD')

        # 4. Another user trying to hold the same seats should get 409 Conflict
        conflict_res = other_client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat_recliner.id]},
            format='json'
        )
        self.assertEqual(conflict_res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('conflict_seats', conflict_res.data)

        # 5. Simulate expired hold by winding back expires_at
        SeatHold.objects.filter(show=self.show).update(expires_at=timezone.now() - datetime.timedelta(minutes=1))
        
        # After expiry, other user CAN now hold the seats
        after_expiry_res = other_client.post(
            f'/api/shows/{self.show.id}/hold-seats/',
            {'seat_ids': [self.seat_recliner.id]},
            format='json'
        )
        self.assertEqual(after_expiry_res.status_code, status.HTTP_200_OK)

    def test_booking_creation_pricing_breakdown(self):
        # Create booking for seat_recliner (₹350) and seat_regular (₹150) = ₹500 base
        # Convenience fee = ₹30 * 2 = ₹60
        # Tax = 18% of ₹60 = ₹10.80
        # Grand total = ₹570.80
        payload = {
            'show_id': self.show.id,
            'seat_ids': [self.seat_recliner.id, self.seat_regular.id],
            'payment_method': 'SIMULATED_CARD'
        }
        res = self.client.post('/api/bookings/create/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['base_amount'], 500.0)
        self.assertEqual(res.data['convenience_fee'], 60.0)
        self.assertEqual(res.data['tax_amount'], 10.8)
        self.assertEqual(res.data['grand_total'], 570.8)
        self.assertTrue(res.data['booking_reference'].startswith('CB-'))

    def test_movie_search_by_cast_and_director(self):
        # Update movie with cast and director
        self.movie.cast = "Robert Downey Jr., Chris Hemsworth, Mark Ruffalo"
        self.movie.director = "Anthony Russo, Joe Russo"
        self.movie.save()

        # Search by cast member
        res_cast = self.client.get('/api/movies/?search=Hemsworth')
        self.assertEqual(res_cast.status_code, status.HTTP_200_OK)
        titles_cast = [m['title'] for m in res_cast.data.get('results', res_cast.data)]
        self.assertIn("Avengers: Infinity War", titles_cast)

        # Search by director
        res_dir = self.client.get('/api/movies/?search=Russo')
        self.assertEqual(res_dir.status_code, status.HTTP_200_OK)
        titles_dir = [m['title'] for m in res_dir.data.get('results', res_dir.data)]
        self.assertIn("Avengers: Infinity War", titles_dir)

    def test_cancellation_policy_eligible_and_ineligible(self):
        # 1. Create and confirm a booking for tomorrow's show (> 2 hours away)
        create_res = self.client.post('/api/bookings/create/', {
            'show_id': self.show.id,
            'seat_ids': [self.seat_regular.id],
            'payment_method': 'SIMULATED_CARD'
        }, format='json')
        booking_ref = create_res.data['booking_reference']
        self.client.post(f'/api/bookings/{booking_ref}/verify-payment/', {'status': 'SUCCESS'}, format='json')

        # Check booking detail serializer reflects can_cancel=True
        detail_res = self.client.get(f'/api/bookings/{booking_ref}/')
        self.assertTrue(detail_res.data['can_cancel'])
        self.assertEqual(detail_res.data['estimated_refund'], 150.0)

        # 2. Cancel the eligible booking
        cancel_res = self.client.post(f'/api/bookings/{booking_ref}/cancel/')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['status'], 'CANCELLED')
        self.assertEqual(cancel_res.data['refund_amount'], 150.0)

        # Seat should be released
        self.assertEqual(BookingSeat.objects.filter(booking__booking_reference=booking_ref).count(), 0)

        # Repeated cancellation must be rejected
        repeat_cancel = self.client.post(f'/api/bookings/{booking_ref}/cancel/')
        self.assertEqual(repeat_cancel.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Ineligible show (show in the past)
        past_show = Show.objects.create(
            movie=self.movie,
            screen=self.screen,
            date=datetime.date.today() - datetime.timedelta(days=1),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(12, 30),
            price_regular=Decimal('150.00'),
            price_premium=Decimal('250.00'),
            price_recliner=Decimal('350.00'),
        )
        past_booking = Booking.objects.create(
            booking_reference="CB-PAST-001",
            user=self.user,
            show=past_show,
            total_tickets=1,
            base_amount=Decimal('150.00'),
            convenience_fee=Decimal('30.00'),
            tax_amount=Decimal('5.40'),
            grand_total=Decimal('185.40'),
            status='CONFIRMED'
        )
        past_cancel = self.client.post(f'/api/bookings/{past_booking.booking_reference}/cancel/')
        self.assertEqual(past_cancel.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("past or ongoing", past_cancel.data['error'])

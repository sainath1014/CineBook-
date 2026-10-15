from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from core.models import UserProfile, City, Theatre


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.city = City.objects.create(name="Hyderabad", state="Telangana")
        self.theatre = Theatre.objects.create(
            name="CineBook Demo Theatre — Ameerpet",
            city=self.city,
            address="Ameerpet, Hyderabad"
        )

    def test_customer_registration_and_login(self):
        # 1. Register customer
        reg_payload = {
            "username": "testcust",
            "email": "testcust@example.com",
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "Customer",
            "role": "CUSTOMER",
            "phone": "+91 9999911111"
        }
        res = self.client.post('/api/auth/register/', reg_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'testcust')
        self.assertEqual(res.data['user']['profile']['role'], 'CUSTOMER')

        # 2. Login
        login_payload = {
            "username": "testcust",
            "password": "Password123!"
        }
        login_res = self.client.post('/api/auth/login/', login_payload, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.data)

        # 3. Access /api/auth/me/ with token
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + login_res.data['token'])
        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'testcust')

    def test_staff_registration_with_theatre_assignment(self):
        reg_payload = {
            "username": "staff_test",
            "email": "staff@example.com",
            "password": "StaffPassword123!",
            "role": "STAFF",
            "theatre_id": self.theatre.id
        }
        res = self.client.post('/api/auth/register/', reg_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['profile']['role'], 'STAFF')
        self.assertEqual(res.data['user']['profile']['theatre'], self.theatre.id)

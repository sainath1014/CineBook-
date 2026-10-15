from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'movies', views.MovieViewSet, basename='movies')

urlpatterns = [
    # Auth
    path('auth/register/', views.register_view, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/me/', views.me_view, name='auth-me'),

    # Public Discovery
    path('cities/', views.cities_list, name='cities-list'),
    path('theatres/', views.theatres_list, name='theatres-list'),
    path('shows/', views.shows_list, name='shows-list'),
    path('shows/<int:pk>/', views.show_detail, name='show-detail'),
    path('shows/<int:pk>/seats/', views.show_seats, name='show-seats'),
    path('shows/<int:pk>/hold-seats/', views.hold_seats_view, name='show-hold-seats'),
    path('shows/<int:pk>/release-seats/', views.release_seats_view, name='show-release-seats'),

    # Booking & Payment
    path('bookings/create/', views.create_booking_view, name='booking-create'),
    path('bookings/my-bookings/', views.my_bookings_view, name='booking-my-list'),
    path('bookings/<str:booking_ref>/', views.booking_detail_view, name='booking-detail'),
    path('bookings/<str:booking_ref>/verify-payment/', views.verify_payment_view, name='booking-verify-payment'),
    path('bookings/<str:booking_ref>/cancel/', views.cancel_booking_view, name='booking-cancel'),

    # Staff Portal & QR Scanner
    path('staff/verify-ticket/', views.staff_verify_ticket_view, name='staff-verify-ticket'),
    path('staff/scans/', views.staff_scan_logs_view, name='staff-scan-logs'),

    # Admin Analytics
    path('admin/metrics/', views.admin_metrics_view, name='admin-metrics'),

    # Router (Movies)
    path('', include(router.urls)),
]

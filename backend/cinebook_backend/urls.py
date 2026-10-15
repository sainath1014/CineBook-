from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        "status": "online",
        "app": "CineBook Cinema Ticket Booking Platform API",
        "version": "1.0.0",
        "endpoints": {
            "movies": "/api/movies/",
            "cities": "/api/cities/",
            "theatres": "/api/theatres/",
            "shows": "/api/shows/",
            "admin": "/admin/",
        }
    })

urlpatterns = [
    path('', api_root_view, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

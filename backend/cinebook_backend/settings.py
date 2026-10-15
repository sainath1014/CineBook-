import os
from pathlib import Path

# Safe PyMySQL initialization for MySQL support
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------------------------------------------------------
# Security & Environment
# -----------------------------------------------------------------------------
# Render automatically sets RENDER=true in its runtime environment
IS_RENDER = os.environ.get('RENDER') is not None

# DEBUG is True for local development unless explicitly set, and False by default on Render/production
default_debug = 'False' if IS_RENDER else 'True'
DEBUG = os.environ.get('DEBUG', default_debug).lower() in ('true', '1', 'yes')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'cinebook-development-only-secret-key-change-in-production-2026'
    else:
        import secrets
        SECRET_KEY = secrets.token_urlsafe(50)

# ALLOWED_HOSTS configuration
allowed_hosts_env = os.environ.get('ALLOWED_HOSTS', '')
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '.onrender.com']

# Render automatically provides RENDER_EXTERNAL_HOSTNAME
render_external_hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if render_external_hostname and render_external_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_external_hostname)

# -----------------------------------------------------------------------------
# Installed Applications
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    
    # Internal apps
    'core',
]

# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cinebook_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cinebook_backend.wsgi.application'

# -----------------------------------------------------------------------------
# Database Configuration
# Priority:
# 1. DATABASE_URL (Render PostgreSQL or any external PostgreSQL/MySQL database)
# 2. USE_MYSQL=True (MySQL database using individual credentials)
# 3. Default fallback: Local SQLite (db.sqlite3)
# -----------------------------------------------------------------------------
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_MYSQL = os.environ.get('USE_MYSQL', 'False').lower() in ('true', '1', 'yes')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=False if DEBUG else True,
        )
    }
elif USE_MYSQL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'cinebook_db'),
            'USER': os.environ.get('DB_USER', 'root'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
            'PORT': os.environ.get('DB_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------------
# Static and Media Files (WhiteNoise for Production)
# -----------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_MANIFEST_STRICT = False

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------------------------------------------------------
# Django REST Framework
# -----------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# -----------------------------------------------------------------------------
# CORS & CSRF Settings
# -----------------------------------------------------------------------------
CORS_ALLOW_CREDENTIALS = True

cors_allowed_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
frontend_url_env = os.environ.get('FRONTEND_URL', '')

if DEBUG and not cors_allowed_env:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1', 'yes')
    allowed_cors_list = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
    if cors_allowed_env:
        allowed_cors_list.extend([origin.strip() for origin in cors_allowed_env.split(',') if origin.strip()])
    if frontend_url_env:
        allowed_cors_list.append(frontend_url_env.strip())
    CORS_ALLOWED_ORIGINS = list(dict.fromkeys(allowed_cors_list))

# CSRF Trusted Origins for admin & authenticated requests
csrf_trusted_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
csrf_list = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]
if csrf_trusted_env:
    csrf_list.extend([origin.strip() for origin in csrf_trusted_env.split(',') if origin.strip()])
if frontend_url_env:
    csrf_list.append(frontend_url_env.strip())
if render_external_hostname:
    csrf_list.append(f'https://{render_external_hostname}')
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(csrf_list))

# -----------------------------------------------------------------------------
# Payment & Business Rules
# -----------------------------------------------------------------------------
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_CineBookDemoKey')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'CineBookTestSecretKey2026')
# When True, simulated mock payment is active alongside Razorpay test mode
RAZORPAY_SIMULATED_MODE = os.environ.get('RAZORPAY_SIMULATED_MODE', 'True').lower() in ('true', '1', 'yes')

SEAT_HOLD_DURATION_MINUTES = int(os.environ.get('SEAT_HOLD_DURATION_MINUTES', '5'))
CANCELLATION_CUTOFF_HOURS = int(os.environ.get('CANCELLATION_CUTOFF_HOURS', '2'))
CONVENIENCE_FEE_PER_TICKET = 30.00
TAX_RATE_PERCENTAGE = 18.00  # GST 18% on convenience fee

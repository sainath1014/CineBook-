# CineBook — Full-Stack Cinema Ticket Booking & Gate Verification Platform

CineBook is a full-stack cinema ticketing and gate verification platform inspired by modern cinema booking mobile and web designs. It features an interactive curved screen seat map, temporary 5-minute atomic backend seat holds, test-mode payment gateway integration, cryptographic QR e-ticket generation, and a dedicated theatre staff portal with browser camera QR scanning and replay protection.

---

## 🎬 Tech Stack

- **Frontend**: React 18, Vite, JavaScript, React Router 6, Axios, Lucide Icons, `html5-qrcode` (camera-based QR scanner), and `canvas-confetti`.
- **Backend**: Python 3.12, Django 6.1, Django REST Framework, Token Authentication, and Django Management Commands.
- **Database**: MySQL 8.0 support with automatic SQLite fallback for simple local development.
- **QR Generation**: Python `qrcode` generating base64 PNG Data URIs.
- **Payments**: Test mode integration with Razorpay (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) alongside a built-in simulated test-mode payment gateway.

---

## 🏛️ System Architecture & Workflow

```
[Customer]
   │
   ├─► 1. Browse Movies & Scheduled Shows (Filter by City, Genre, Language)
   │
   ├─► 2. Interactive Seat Selection (Curved Screen Arc, Recliner / Premium / Regular)
   │
   ├─► 3. Atomic Seat Hold (/api/shows/<id>/hold-seats/ with 5-minute expiry)
   │
   ├─► 4. Checkout & Payment (Razorpay Test Mode / Simulated Gateway with card & UPI)
   │
   └─► 5. Confirmed Booking & Cryptographic QR E-Ticket Issuance
                                │
                                ▼
                       [Gate Staff Portal]
                                │
      ┌─────────────────────────┴─────────────────────────┐
      ▼                                                   ▼
[Camera QR Scan]                                 [Manual Token Entry]
      │                                                   │
      └─────────────────────────┬─────────────────────────┘
                                ▼
         Authoritative Backend Verification (/api/staff/verify-ticket/)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  [First Scan]            [Second Scan]          [Wrong Theatre]
🟢 TICKET VERIFIED      🔴 TICKET ALREADY USED  🔴 INVALID THEATRE
  ENTRY ALLOWED           ENTRY DENIED            ENTRY DENIED
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.12.7)
- **Node.js**: 18+ (tested on Node v24.14.1 / npm 11.11.0)
- **MySQL** (Optional): MySQL Server 8.0. If not configured, SQLite3 is used automatically.

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional for local SQLite development)
copy .env.example .env

# Run database migrations
python manage.py migrate

# Seed sample movies, Hyderabad demo theatres, screens, seat layouts, shows, and demo accounts
python manage.py seed_data

# Start the Django development server (runs on http://127.0.0.1:8000)
python manage.py runserver 127.0.0.1:8000
```

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

The frontend includes an automated proxy forwarding all `/api` requests to `http://127.0.0.1:8000`.

---

## 👥 Seeded Demo Accounts

You can log in instantly using the **One-Click Demo Accounts** on the `/login` page:

| Role | Username | Password | Assigned Theatre / Permissions |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer1` | `cust123` | Customer (has sample confirmed booking) |
| **Staff (Ameerpet)** | `staff_ameerpet` | `staff123` | CineBook Demo Theatre — Ameerpet |
| **Staff (Kukatpally)**| `staff_kukatpally` | `staff123` | CineBook Demo Theatre — Kukatpally |
| **Staff (Gachibowli)** | `staff_gachibowli` | `staff123` | CineBook Demo Theatre — Gachibowli |
| **Platform Admin** | `admin` | `admin123` | Platform Admin (`is_staff`, `is_superuser`) |

---

## 🎥 Seeded Movie Catalogue (10 Movies)

The `seed_data` command seeds the database with the required movies with posters and backdrops:
1. **Avengers: Infinity War** — English, Action/Sci-Fi/Adventure (Rating: 8.5)
2. **Interstellar** — English, Sci-Fi/Drama (Rating: 8.7)
3. **Inception** — English, Action/Sci-Fi/Thriller (Rating: 8.8)
4. **The Dark Knight** — English, Action/Crime/Drama (Rating: 9.0)
5. **Baahubali: The Beginning** — Telugu, Action/Drama/Historical (Rating: 8.2)
6. **RRR** — Telugu, Action/Drama/Period (Rating: 8.6)
7. **Pushpa: The Rise** — Telugu, Action/Crime/Thriller (Rating: 8.0)
8. **Kalki 2898 AD** — Telugu, Sci-Fi/Action/Mythological (Rating: 8.3)
9. **Hi Nanna** — Telugu, Romance/Drama/Family (Rating: 8.1)
10. **Dangal** — Hindi, Sports/Drama (Rating: 8.4)

---

## 🧪 Automated Backend Tests

The project includes an automated test suite verifying all critical business constraints, concurrency protections, and scanning rules:

```bash
cd backend
python manage.py test core
```

### Test Coverage Highlights (15 Tests):
- `test_customer_registration_and_login`: User creation, password hashing, and token issuance.
- `test_staff_registration_with_theatre_assignment`: Staff role and assigned theatre linkage.
- `test_seat_availability_endpoint`: Accurate seat statuses (`AVAILABLE`, `BOOKED`, `HELD`).
- `test_seat_hold_and_expiry`: 5-minute holds, hold conflicts (409 Conflict), and automatic expiry release.
- `test_booking_creation_pricing_breakdown`: Server-side pricing (base amount + ₹30 convenience fee/seat + 18% GST).
- `test_database_unique_constraint_on_show_seat`: Database-level prevention of duplicate seat bookings.
- `test_prevent_second_user_from_booking_already_confirmed_seat`: Transactional concurrency prevention.
- `test_complete_booking_and_payment_flow`: End-to-end checkout, ticket generation, and base64 QR generation.
- `test_failed_payment_releases_seats`: Seat holds released on failed payment simulation.
- `test_razorpay_signature_verifier_utility`: HMAC-SHA256 signature verification.
- `test_first_scan_verifies_and_grants_entry`: Staff verification returns GREEN "TICKET VERIFIED — ENTRY ALLOWED" and marks ticket `REDEEMED`.
- `test_second_scan_rejected_as_already_used`: Duplicate scan of the same ticket returns RED "TICKET ALREADY USED — ENTRY DENIED".
- `test_scan_at_wrong_theatre_rejected`: Staff assigned to Ameerpet scanning ticket for Kukatpally returns RED "INVALID THEATRE — ENTRY DENIED".
- `test_customer_cannot_call_staff_verification`: Role-based access control blocking customer accounts from staff endpoints (403 Forbidden).
- `test_invalid_token_returns_entry_denied`: Unrecognized QR codes rejected safely.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Register new customer or staff | No |
| `POST` | `/api/auth/login/` | User login (returns auth token) | No |
| `GET` | `/api/auth/me/` | Current user profile | Token |
| `GET` | `/api/movies/` | List movies with genre, language, city filters | No |
| `GET` | `/api/movies/<id>/` | Movie details | No |
| `GET` | `/api/cities/` | List active cities | No |
| `GET` | `/api/theatres/?city=<id>` | List theatres in selected city | No |
| `GET` | `/api/shows/?movie=<id>` | List scheduled showtimes | No |
| `GET` | `/api/shows/<id>/seats/` | Real-time seat availability map | No |
| `POST` | `/api/shows/<id>/hold-seats/` | Temporarily hold seats (5 mins) | Optional (User/Session) |
| `POST` | `/api/shows/<id>/release-seats/` | Release held seats | Optional (User/Session) |
| `POST` | `/api/bookings/create/` | Create pending booking & calculate price | Token |
| `POST` | `/api/bookings/<ref>/verify-payment/` | Verify payment and issue QR ticket | Token |
| `GET` | `/api/bookings/my-bookings/` | Customer booking history | Token |
| `GET` | `/api/bookings/<ref>/` | Booking details | Token (Owner/Staff) |
| `POST` | `/api/bookings/<ref>/cancel/` | Cancel booking & release seats | Token (Owner) |
| `POST` | `/api/staff/verify-ticket/` | Authoritative gate QR code scanner | Token (Staff) |
| `GET` | `/api/staff/scans/` | Recent check-in history | Token (Staff) |
| `GET` | `/api/admin/metrics/` | Platform metrics & revenue analytics | Token (Admin) |

---

## 💳 Payment Gateway Configuration

### 1. Simulated Demo Mode (Default)
In `.env` or `settings.py`, `RAZORPAY_SIMULATED_MODE=True` enables the interactive in-app simulator. It supports:
- Interactive Card preview styled like the reference design.
- UPI / QR payment simulation.
- A "Simulate Payment Failure" checkbox to test error handling and automatic seat hold release.

### 2. Live Razorpay Test Mode
To test with real Razorpay Test Credentials:
1. Create a free account at [Razorpay](https://razorpay.com).
2. Generate Test Key ID and Secret in Razorpay Dashboard -> Settings -> API Keys.
3. Update `backend/.env`:
   ```ini
   RAZORPAY_SIMULATED_MODE=False
   RAZORPAY_KEY_ID=rzp_test_YourTestKeyId
   RAZORPAY_KEY_SECRET=YourTestKeySecret
   ```
4. Restart the Django development server.

---

## 📷 Camera Permissions & QR Scanner

The Theatre Staff Portal uses the device camera via `html5-qrcode` to scan tickets:
1. Navigate to `http://localhost:5173/staff/scanner`.
2. Allow camera permissions when prompted by your browser.
3. If using an environment where camera permissions cannot be granted, use the **Manual Entry** tab to test tokens.

---

## 🛡️ Security & Concurrency Design

- **Atomic Transactions**: Seat reservations, hold creations, payment confirmations, and ticket check-ins use Django `transaction.atomic()` and `select_for_update()` row-level locks.
- **Unique Seat Constraints**: `BookingSeat` model enforces `unique_together = ('show', 'seat')`.
- **Token Cryptography**: Verification tokens are generated using `secrets.token_urlsafe(32)` with SHA-256 hashes stored for validation.
- **Replay Protection**: Scanning a ticket marks it as `REDEEMED` atomically. Subsequent scans are rejected with an informative timestamp and previous scanner name.
- **Auditorium Isolation**: Staff assigned to one theatre (e.g. Ameerpet) cannot scan tickets issued for another theatre (e.g. Kukatpally).

---

## 🌐 Public Deployment Guide (Render & Cloud PostgreSQL)

CineBook is production-ready for deployment on [Render](https://render.com).

### Architecture on Render
- **Database**: Managed PostgreSQL instance (free tier).
- **Backend API**: Python 3 Web Service running Gunicorn + WhiteNoise for static files.
- **Frontend SPA**: React + Vite Static Site with client-side SPA routing (`/* -> /index.html`).

---

### Step 1: Push Code to GitHub

1. Initialize Git in the project root:
   ```bash
   git init
   git add .
   git commit -m "feat: complete full-stack CineBook application ready for Render deployment"
   ```
2. Create a new repository on [GitHub](https://github.com/new) (e.g., `cinebook`).
3. Link and push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cinebook.git
   git push -u origin main
   ```

---

### Step 2: One-Click Deployment via Render Blueprint (Recommended)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub repository `cinebook`.
4. Render detects [`render.yaml`](file:///C:/Users/NARAYANA/.gemini/antigravity/scratch/cinebook/render.yaml) and automatically creates:
   - `cinebook-db` (PostgreSQL)
   - `cinebook-backend` (Django API Web Service)
   - `cinebook-frontend` (Vite Static Site)
5. Click **Apply**. Render will build and deploy the entire platform automatically!

---

### Step 3: Manual Deployment on Render (Step-by-Step for Beginners)

If you prefer to configure each service manually in the Render Dashboard:

#### 1. Create PostgreSQL Database
1. In Render Dashboard, click **New +** -> **PostgreSQL**.
2. **Name**: `cinebook-db`
3. **Database**: `cinebook`
4. **User**: `cinebook_user`
5. **Plan**: Free
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (e.g., `postgres://cinebook_user:...@dpg-...-a/cinebook`).

#### 2. Create Backend Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your `cinebook` GitHub repository.
3. Configure the settings:
   - **Name**: `cinebook-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Region**: Same as database (e.g., Oregon)
   - **Branch**: `main`
   - **Build Command**: `./render-build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate && python manage.py seed_data`)
   - **Start Command**: `gunicorn cinebook_backend.wsgi:application`
   - **Plan**: Free
4. Add **Environment Variables**:
   - `DJANGO_SECRET_KEY`: *(Click Generate or enter a secure random string)*
   - `DEBUG`: `False`
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 3.1)*
   - `RAZORPAY_SIMULATED_MODE`: `True`
   - `SEAT_HOLD_DURATION_MINUTES`: `5`
   - `CANCELLATION_CUTOFF_HOURS`: `2`
   - `FRONTEND_URL`: `https://cinebook-frontend.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://cinebook-frontend.onrender.com`
5. Click **Deploy Web Service**.
6. When the deploy finishes, note your backend URL (e.g., `https://cinebook-backend.onrender.com`). Visiting `https://cinebook-backend.onrender.com/` returns the live API health check JSON.

#### 3. Create Frontend Static Site
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect your `cinebook` GitHub repository.
3. Configure the settings:
   - **Name**: `cinebook-frontend`
   - **Root Directory**: `frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://cinebook-backend.onrender.com/api` *(use your backend URL from Step 3.2)*
5. Configure **Redirects / Rewrites** (under Static Site Settings):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures direct paths like `/my-bookings` and `/staff/scan` work without 404s).*
6. Click **Create Static Site**.

---

### Step 4: Database Migration & Backup Strategy

#### Backing up local data:
To export your local data into a JSON fixture:
```bash
cd backend
python manage.py dumpdata core auth.User --indent 2 -o initial_data.json
```

#### Restoring into Cloud PostgreSQL:
When deploying on Render, `./render-build.sh` runs `python manage.py seed_data` automatically to schedule fresh shows for the current week. If you prefer to load your exact local database records:
```bash
# In the Render Web Service Shell (or locally with DATABASE_URL set):
python manage.py loaddata initial_data.json
```

#### Switching between SQLite and MySQL locally:
- **SQLite (Default)**: Leave `USE_MYSQL=False` (or omitted). `backend/db.sqlite3` is used.
- **MySQL**: Set `USE_MYSQL=True`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in your `.env` file.

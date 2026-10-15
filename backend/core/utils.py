import io
import base64
import hmac
import hashlib
import secrets
import qrcode
from django.utils import timezone
from django.conf import settings
from .models import SeatHold


def generate_secure_token():
    """Generates a cryptographically random, unpredictable token for ticket QR codes."""
    return f"cbt_{secrets.token_urlsafe(32)}"


def generate_qr_code_base64(data_string):
    """
    Generates a high-quality QR code image and returns it as a base64 Data URI.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(data_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"


def clean_expired_holds(show=None):
    """
    Releases all expired holds for a given show or across the database.
    """
    now = timezone.now()
    qs = SeatHold.objects.filter(expires_at__lt=now)
    if show:
        qs = qs.filter(show=show)
    deleted_count, _ = qs.delete()
    return deleted_count


def verify_razorpay_signature(order_id, payment_id, signature, secret_key=None):
    """
    Verifies Razorpay HMAC SHA256 signature.
    """
    if not secret_key:
        secret_key = settings.RAZORPAY_KEY_SECRET
    msg = f"{order_id}|{payment_id}".encode('utf-8')
    secret = secret_key.encode('utf-8')
    expected = hmac.new(secret, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

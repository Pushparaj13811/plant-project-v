from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.utils.html import strip_tags

def generate_reset_token():
    """Generate a random token for password reset."""
    return get_random_string(64)

def send_welcome_email(user, password):
    """
    Send a welcome email to newly created users with their credentials
    """
    context = {
        'user': user,
        'password': password,
        'login_url': f"{settings.FRONTEND_URL}/login"  # You'll need to add FRONTEND_URL to settings.py
    }
    
    # Render email templates
    html_message = render_to_string('welcome_email.html', context)
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject='Welcome to Plant Management System',
        message=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

def is_valid_reset_token(token):
    """Check if the password reset token is valid and not expired."""
    try:
        user = User.objects.get(password_reset_token=token)
        if user.password_reset_token_created:
            # Check if token is less than 24 hours old
            expiry_time = user.password_reset_token_created + timedelta(hours=24)
            if timezone.now() <= expiry_time:
                return user
    except User.DoesNotExist:
        pass
    return None 
from django.core.mail import send_mail, BadHeaderError
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def generate_reset_token():
    """Generate a random token for password reset."""
    return get_random_string(64)

def send_welcome_email(user, password):
    """
    Send a welcome email to newly created users with their credentials
    """
    try:
        context = {
            'user': user,
            'password': password,
            'login_url': f"{settings.FRONTEND_URL}/login"
        }
        
        # Render email templates
        html_message = render_to_string('welcome_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Log email attempt
        logger.info(f"Attempting to send welcome email to {user.email}")
        
        # Verify email settings
        logger.debug(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, "
                    f"USER={settings.EMAIL_HOST_USER}, TLS={settings.EMAIL_USE_TLS}")
        
        # Send email
        send_mail(
            subject='Welcome to Plant Management System',
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Successfully sent welcome email to {user.email}")
        
    except BadHeaderError:
        logger.error("Invalid header found in email")
        raise ValueError("Invalid header found in email")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        raise

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
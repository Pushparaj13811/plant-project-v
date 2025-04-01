import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Send email using SMTP
    """
    if not all([
        settings.SMTP_SERVER,
        settings.SMTP_PORT,
        settings.SMTP_USER,
        settings.SMTP_PASSWORD,
        settings.EMAILS_FROM_EMAIL,
    ]):
        print("Email settings not configured")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.EMAILS_FROM_EMAIL
    message["To"] = email_to

    # Add both HTML and plain text content
    if html_content:
        message.attach(MIMEText(html_content, "html"))
    if text_content:
        message.attach(MIMEText(text_content, "plain"))

    try:
        # Create SMTP connection
        if settings.EMAILS_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT)

        # Login and send email
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
        server.quit()

        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False


def send_password_reset_email(email_to: str, token: str) -> bool:
    """
    Send password reset email with token
    """
    subject = "Password Reset Request"
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <html>
    <body>
        <p>Hi,</p>
        <p>You requested a password reset for your account.</p>
        <p>Please click the link below to reset your password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Plant Data Management Team</p>
    </body>
    </html>
    """
    
    text_content = f"""
    Hi,
    
    You requested a password reset for your account.
    
    Please click the link below to reset your password:
    {reset_link}
    
    If you did not request this, please ignore this email.
    This link will expire in 24 hours.
    
    Best regards,
    Plant Data Management Team
    """
    
    return send_email(email_to, subject, html_content, text_content) 
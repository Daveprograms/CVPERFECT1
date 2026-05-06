"""SMTP helpers usable without Celery (routes import this; workers may too)."""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..core.config import settings

logger = logging.getLogger(__name__)


def send_email_smtp(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> bool:
    """Send email using SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def send_password_reset_email_now(email: str, reset_token: str) -> bool:
    """Send password reset email synchronously (also used by the Celery task)."""
    subject = "Reset Your CVPerfect Password"
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token}"
    html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">Password Reset Request</h1>
                </div>
                
                <p>You requested a password reset for your CVPerfect account.</p>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>Security Notice:</strong> This link expires in 1 hour for your security.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If you didn't request this password reset, you can safely ignore this email.</p>
                
                <p>Best regards,<br>The CVPerfect Team</p>
            </div>
        </body>
        </html>
        """
    return send_email_smtp(email, subject, html_content)

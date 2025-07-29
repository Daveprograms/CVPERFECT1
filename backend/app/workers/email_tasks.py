"""
Email Tasks
Background tasks for sending emails and notifications
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from celery import Task
from sqlalchemy.orm import Session

from .celery_app import celery_app
from ..database import SessionLocal
from ..models.user import User
from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailTask(Task):
    """Base task class for email operations"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run(db, *args, **kwargs)
    
    def run(self, db: Session, *args, **kwargs):
        raise NotImplementedError


def send_email_smtp(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = None
) -> bool:
    """Send email using SMTP"""
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        
        # Add text content
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


@celery_app.task(bind=True, base=EmailTask)
def send_welcome_email(self, db: Session, user_id: str) -> Dict[str, Any]:
    """Send welcome email to new user"""
    
    try:
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        subject = "Welcome to CVPerfect! 🚀"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">Welcome to CVPerfect!</h1>
                </div>
                
                <p>Hi {user.full_name},</p>
                
                <p>Welcome to CVPerfect! We're excited to help you create the perfect resume and advance your career.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0;">Here's what you can do with CVPerfect:</h3>
                    <ul style="color: #4b5563;">
                        <li>📄 Upload and analyze your resume with AI</li>
                        <li>✨ Get personalized feedback and improvement suggestions</li>
                        <li>💼 Generate tailored cover letters for job applications</li>
                        <li>📚 Receive customized learning paths to enhance your skills</li>
                        <li>🎯 Practice with AI-generated interview questions</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/dashboard" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Get Started
                    </a>
                </div>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>The CVPerfect Team</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                            font-size: 12px; color: #6b7280; text-align: center;">
                    <p>CVPerfect - Your AI-Powered Career Assistant</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to CVPerfect!
        
        Hi {user.full_name},
        
        Welcome to CVPerfect! We're excited to help you create the perfect resume and advance your career.
        
        Here's what you can do with CVPerfect:
        - Upload and analyze your resume with AI
        - Get personalized feedback and improvement suggestions
        - Generate tailored cover letters for job applications
        - Receive customized learning paths to enhance your skills
        - Practice with AI-generated interview questions
        
        Get started: {settings.FRONTEND_URL}/dashboard
        
        If you have any questions, feel free to reach out to our support team.
        
        Best regards,
        The CVPerfect Team
        """
        
        success = send_email_smtp(user.email, subject, html_content, text_content)
        
        if success:
            logger.info(f"Welcome email sent to user {user_id}")
            return {"status": "success", "user_id": user_id, "email": user.email}
        else:
            raise Exception("Failed to send email")
            
    except Exception as e:
        logger.error(f"Welcome email failed for user {user_id}: {str(e)}")
        self.retry(countdown=300, max_retries=3)  # Retry after 5 minutes


@celery_app.task(bind=True, base=EmailTask)
def send_analysis_complete_email(
    self, 
    db: Session, 
    user_id: str, 
    resume_id: str, 
    analysis_score: float
) -> Dict[str, Any]:
    """Send email when resume analysis is complete"""
    
    try:
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        subject = f"Your Resume Analysis is Ready! Score: {int(analysis_score)}/100"
        
        # Determine score category
        if analysis_score >= 85:
            score_category = "Excellent"
            score_color = "#10b981"
            score_message = "Your resume looks great! Just a few minor tweaks and you'll be all set."
        elif analysis_score >= 70:
            score_category = "Good"
            score_color = "#3b82f6"
            score_message = "Your resume is solid with room for improvement. Check out our recommendations."
        elif analysis_score >= 55:
            score_category = "Fair"
            score_color = "#f59e0b"
            score_message = "Your resume has potential. Our AI has identified key areas for enhancement."
        else:
            score_category = "Needs Work"
            score_color = "#ef4444"
            score_message = "Let's work together to significantly improve your resume's impact."
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">Resume Analysis Complete! 📊</h1>
                </div>
                
                <p>Hi {user.full_name},</p>
                
                <p>Great news! Your resume analysis is ready and waiting for you.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2 style="margin-top: 0; color: {score_color};">
                        Your Resume Score: {int(analysis_score)}/100
                    </h2>
                    <p style="font-size: 18px; color: {score_color}; font-weight: bold;">
                        {score_category}
                    </p>
                    <p style="color: #4b5563;">{score_message}</p>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #065f46; margin-top: 0;">What's Included in Your Analysis:</h3>
                    <ul style="color: #047857;">
                        <li>📈 Overall resume score and ATS compatibility</li>
                        <li>💪 Your key strengths and accomplishments</li>
                        <li>🎯 Specific improvement recommendations</li>
                        <li>🔍 Detailed feedback on each section</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/ai-feedback/{resume_id}" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        View Your Analysis
                    </a>
                </div>
                
                <p>Ready to take the next step? Try our other AI-powered features:</p>
                <ul>
                    <li>Generate a custom cover letter</li>
                    <li>Get a personalized learning path</li>
                    <li>Practice with AI interview questions</li>
                </ul>
                
                <p>Best regards,<br>The CVPerfect Team</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                            font-size: 12px; color: #6b7280; text-align: center;">
                    <p>CVPerfect - Your AI-Powered Career Assistant</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        success = send_email_smtp(user.email, subject, html_content)
        
        if success:
            logger.info(f"Analysis complete email sent to user {user_id}")
            return {"status": "success", "user_id": user_id, "resume_id": resume_id}
        else:
            raise Exception("Failed to send email")
            
    except Exception as e:
        logger.error(f"Analysis complete email failed for user {user_id}: {str(e)}")
        self.retry(countdown=300, max_retries=3)


@celery_app.task(bind=True)
def send_password_reset_email(
    self, 
    email: str, 
    reset_token: str
) -> Dict[str, Any]:
    """Send password reset email"""
    
    try:
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
        
        success = send_email_smtp(email, subject, html_content)
        
        if success:
            logger.info(f"Password reset email sent to {email}")
            return {"status": "success", "email": email}
        else:
            raise Exception("Failed to send email")
            
    except Exception as e:
        logger.error(f"Password reset email failed for {email}: {str(e)}")
        self.retry(countdown=300, max_retries=3)


@celery_app.task(bind=True, base=EmailTask)
def send_weekly_digest_email(self, db: Session, user_id: str) -> Dict[str, Any]:
    """Send weekly digest email with user statistics"""
    
    try:
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Get user statistics (this would require implementing analytics tracking)
        # For now, we'll use placeholder data
        stats = {
            'resumes_analyzed': 3,
            'improvement_score': 12,
            'goals_completed': 2
        }
        
        subject = "Your Weekly CVPerfect Progress Report 📈"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6;">Your Weekly Progress 📊</h1>
                </div>
                
                <p>Hi {user.full_name},</p>
                
                <p>Here's your weekly summary of activity on CVPerfect:</p>
                
                <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                color: white; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center;">
                        <h3 style="margin: 0; font-size: 24px;">{stats['resumes_analyzed']}</h3>
                        <p style="margin: 5px 0 0;">Resumes Analyzed</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                                color: white; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center;">
                        <h3 style="margin: 0; font-size: 24px;">+{stats['improvement_score']}</h3>
                        <p style="margin: 5px 0 0;">Score Improvement</p>
                    </div>
                </div>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #0c4a6e; margin-top: 0;">Keep Up the Momentum! 🚀</h3>
                    <p style="color: #0369a1;">
                        You're making great progress! Consider trying our cover letter generator 
                        or practice interview questions to further enhance your job search.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/dashboard" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Continue Your Journey
                    </a>
                </div>
                
                <p>Best regards,<br>The CVPerfect Team</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                            font-size: 12px; color: #6b7280; text-align: center;">
                    <p>Don't want these emails? <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        success = send_email_smtp(user.email, subject, html_content)
        
        if success:
            logger.info(f"Weekly digest email sent to user {user_id}")
            return {"status": "success", "user_id": user_id}
        else:
            raise Exception("Failed to send email")
            
    except Exception as e:
        logger.error(f"Weekly digest email failed for user {user_id}: {str(e)}")
        self.retry(countdown=300, max_retries=3)


@celery_app.task
def send_bulk_notification_email(
    user_ids: List[str], 
    subject: str, 
    message: str,
    email_type: str = "notification"
) -> Dict[str, Any]:
    """Send bulk notification emails to multiple users"""
    
    try:
        sent_count = 0
        failed_count = 0
        
        with SessionLocal() as db:
            for user_id in user_ids:
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if not user:
                        logger.warning(f"User {user_id} not found for bulk email")
                        failed_count += 1
                        continue
                    
                    html_content = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #3b82f6;">CVPerfect Update</h1>
                            </div>
                            
                            <p>Hi {user.full_name},</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                {message}
                            </div>
                            
                            <p>Best regards,<br>The CVPerfect Team</p>
                        </div>
                    </body>
                    </html>
                    """
                    
                    success = send_email_smtp(user.email, subject, html_content)
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"Failed to send bulk email to user {user_id}: {str(e)}")
                    failed_count += 1
        
        logger.info(f"Bulk email complete: {sent_count} sent, {failed_count} failed")
        return {
            "status": "completed",
            "sent_count": sent_count,
            "failed_count": failed_count,
            "total_users": len(user_ids)
        }
        
    except Exception as e:
        logger.error(f"Bulk email task failed: {str(e)}")
        return {
            "status": "failed",
            "error": str(e),
            "sent_count": 0,
            "failed_count": len(user_ids)
        } 
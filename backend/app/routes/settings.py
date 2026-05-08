"""
Settings Router
User account settings and profile management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..core.dependencies import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter()


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    current_role: Optional[str] = None
    job_search_status: Optional[str] = None

class NotificationPreferences(BaseModel):
    email_job_alerts: Optional[bool] = True
    email_weekly_report: Optional[bool] = True
    email_ai_tips: Optional[bool] = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    current_role: Optional[str]
    job_search_status: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    subscription_type: str
    onboarding_completed: bool
    preferred_job_types: list
    top_technologies: list
    help_needed: list
    preferences: dict
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=ProfileResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's settings and profile data"""
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        current_role=current_user.current_role,
        job_search_status=current_user.job_search_status,
        linkedin_url=current_user.linkedin_url,
        github_url=current_user.github_url,
        subscription_type=current_user.subscription_type.value,
        onboarding_completed=current_user.onboarding_completed,
        preferred_job_types=current_user.preferred_job_types or [],
        top_technologies=current_user.top_technologies or [],
        help_needed=current_user.help_needed or [],
        preferences=current_user.preferences or {},
        created_at=current_user.created_at,
    )


@router.put("/", response_model=ProfileResponse)
async def update_settings(
    updates: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile settings"""
    update_data = updates.model_dump(exclude_none=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        current_role=current_user.current_role,
        job_search_status=current_user.job_search_status,
        linkedin_url=current_user.linkedin_url,
        github_url=current_user.github_url,
        subscription_type=current_user.subscription_type.value,
        onboarding_completed=current_user.onboarding_completed,
        preferred_job_types=current_user.preferred_job_types or [],
        top_technologies=current_user.top_technologies or [],
        help_needed=current_user.help_needed or [],
        preferences=current_user.preferences or {},
        created_at=current_user.created_at,
    )


@router.put("/notifications")
async def update_notification_preferences(
    prefs: NotificationPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update email notification preferences"""
    existing_prefs = current_user.preferences or {}
    existing_prefs["notifications"] = prefs.model_dump()
    current_user.preferences = existing_prefs
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification preferences updated", "preferences": existing_prefs["notifications"]}


@router.get("/notifications")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
):
    """Get email notification preferences"""
    prefs = current_user.preferences or {}
    notifications = prefs.get("notifications", {
        "email_job_alerts": True,
        "email_weekly_report": True,
        "email_ai_tips": True
    })
    return {"preferences": notifications}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate user account.
    We soft-delete (deactivate) rather than hard delete to preserve audit trails.
    """
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Account has been deactivated. Contact support to restore access."}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
import re

from ..database import get_db
from ..models.user import User
from ..schemas.onboarding import OnboardingData, OnboardingResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

def validate_url(url: str) -> bool:
    """Validate URL format"""
    if not url:
        return True
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(url_pattern.match(url))

@router.post("/", response_model=OnboardingResponse)
async def save_onboarding_data(
    onboarding_data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user onboarding data"""
    try:
        # Validate URLs if provided
        if onboarding_data.linkedin_url and not validate_url(onboarding_data.linkedin_url):
            raise HTTPException(status_code=400, detail="Invalid LinkedIn URL format")
        
        if onboarding_data.github_url and not validate_url(onboarding_data.github_url):
            raise HTTPException(status_code=400, detail="Invalid GitHub URL format")

        # Update user with onboarding data
        current_user.onboarding_completed = True
        current_user.current_role = onboarding_data.current_role
        current_user.job_search_status = onboarding_data.job_search_status
        current_user.internship_date_range = onboarding_data.internship_date_range
        current_user.preferred_job_types = onboarding_data.preferred_job_types
        current_user.top_technologies = onboarding_data.top_technologies
        current_user.help_needed = onboarding_data.help_needed
        current_user.linkedin_url = onboarding_data.linkedin_url
        current_user.github_url = onboarding_data.github_url

        db.commit()
        db.refresh(current_user)

        print(f"✅ Onboarding completed for user {current_user.email}")

        return OnboardingResponse(
            success=True,
            message="Onboarding data saved successfully",
            user_id=str(current_user.id)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Onboarding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save onboarding data: {str(e)}")

@router.get("/status")
async def get_onboarding_status(
    current_user: User = Depends(get_current_user)
):
    """Get user's onboarding completion status"""
    return {
        "onboarding_completed": current_user.onboarding_completed,
        "current_role": current_user.current_role,
        "job_search_status": current_user.job_search_status,
        "preferred_job_types": current_user.preferred_job_types,
        "top_technologies": current_user.top_technologies,
        "help_needed": current_user.help_needed
    } 
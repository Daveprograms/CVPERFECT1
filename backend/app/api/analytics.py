from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

from ..database import get_db
from ..models.user import User
from ..models.analytics import Analytics, ActionType
from ..models.resume import Resume
from ..schemas.analytics import (
    AnalyticsResponse,
    UserInsightsResponse,
    ResumeInsightsResponse,
    GlobalStatsResponse
)
from .auth import get_current_user

router = APIRouter()

@router.get("/user", response_model=UserInsightsResponse)
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's analytics
    analytics = db.query(Analytics).filter(
        Analytics.user_id == current_user.id
    ).order_by(Analytics.created_at.desc()).all()

    # Get user's resumes
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).all()

    # Calculate insights
    total_resumes = len(resumes)
    total_enhancements = sum(1 for a in analytics if a.action_type == ActionType.RESUME_ENHANCE)
    total_downloads = sum(1 for a in analytics if a.action_type == ActionType.RESUME_DOWNLOAD)
    avg_score = db.query(func.avg(Resume.score)).filter(
        Resume.user_id == current_user.id,
        Resume.score.isnot(None)
    ).scalar() or 0

    # Get action distribution
    action_distribution = {}
    for action_type in ActionType:
        count = sum(1 for a in analytics if a.action_type == action_type)
        action_distribution[action_type.value] = count

    # Get recent activity
    recent_activity = []
    for a in analytics[:10]:  # Last 10 activities
        activity = {
            "type": a.action_type.value,
            "timestamp": a.created_at,
            "metadata": a.metadata
        }
        if a.resume_id:
            resume = db.query(Resume).filter(Resume.id == a.resume_id).first()
            if resume:
                activity["resume"] = {
                    "id": resume.id,
                    "score": resume.score
                }
        recent_activity.append(activity)

    return {
        "total_resumes": total_resumes,
        "total_enhancements": total_enhancements,
        "total_downloads": total_downloads,
        "average_score": round(avg_score, 2),
        "action_distribution": action_distribution,
        "recent_activity": recent_activity
    }

@router.get("/resume/{resume_id}", response_model=ResumeInsightsResponse)
async def get_resume_analytics(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get resume analytics
    analytics = db.query(Analytics).filter(
        Analytics.resume_id == resume_id
    ).order_by(Analytics.created_at.desc()).all()

    # Calculate insights
    total_enhancements = sum(1 for a in analytics if a.action_type == ActionType.RESUME_ENHANCE)
    total_downloads = sum(1 for a in analytics if a.action_type == ActionType.RESUME_DOWNLOAD)
    last_enhancement = next(
        (a.created_at for a in analytics if a.action_type == ActionType.RESUME_ENHANCE),
        None
    )
    last_download = next(
        (a.created_at for a in analytics if a.action_type == ActionType.RESUME_DOWNLOAD),
        None
    )

    # Get version history
    versions = []
    for version in resume.versions:
        versions.append({
            "version_number": version.version_number,
            "created_at": version.created_at,
            "changes": version.changes
        })

    return {
        "resume_id": resume.id,
        "score": resume.score,
        "total_enhancements": total_enhancements,
        "total_downloads": total_downloads,
        "last_enhancement": last_enhancement,
        "last_download": last_download,
        "versions": versions,
        "feedback": resume.feedback,
        "learning_suggestions": resume.learning_suggestions
    }

@router.get("/global", response_model=GlobalStatsResponse)
async def get_global_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only allow admin users to access global analytics
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access global analytics"
        )

    # Get time range
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # Calculate global stats
    total_users = db.query(func.count(User.id)).scalar()
    total_resumes = db.query(func.count(Resume.id)).scalar()
    total_enhancements = db.query(func.count(Analytics.id)).filter(
        Analytics.action_type == ActionType.RESUME_ENHANCE,
        Analytics.created_at >= thirty_days_ago
    ).scalar()
    total_downloads = db.query(func.count(Analytics.id)).filter(
        Analytics.action_type == ActionType.RESUME_DOWNLOAD,
        Analytics.created_at >= thirty_days_ago
    ).scalar()
    avg_score = db.query(func.avg(Resume.score)).filter(
        Resume.score.isnot(None)
    ).scalar() or 0

    # Get subscription distribution
    subscription_distribution = {}
    for subscription_type in ["FREE", "ONE_TIME", "PRO"]:
        count = db.query(func.count(User.id)).filter(
            User.subscription_type == subscription_type
        ).scalar()
        subscription_distribution[subscription_type] = count

    # Get daily activity
    daily_activity = []
    for i in range(30):
        date = now - timedelta(days=i)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        enhancements = db.query(func.count(Analytics.id)).filter(
            Analytics.action_type == ActionType.RESUME_ENHANCE,
            Analytics.created_at >= start_of_day,
            Analytics.created_at < end_of_day
        ).scalar()

        downloads = db.query(func.count(Analytics.id)).filter(
            Analytics.action_type == ActionType.RESUME_DOWNLOAD,
            Analytics.created_at >= start_of_day,
            Analytics.created_at < end_of_day
        ).scalar()

        daily_activity.append({
            "date": start_of_day.date(),
            "enhancements": enhancements,
            "downloads": downloads
        })

    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_enhancements_30d": total_enhancements,
        "total_downloads_30d": total_downloads,
        "average_score": round(avg_score, 2),
        "subscription_distribution": subscription_distribution,
        "daily_activity": daily_activity
    } 
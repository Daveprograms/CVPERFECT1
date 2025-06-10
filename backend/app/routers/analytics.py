from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from ..database import get_db
from ..models.user import User
from ..models.analytics import Analytics, ActionType
from ..models.resume import Resume
from ..schemas.analytics import (
    UserInsights,
    GlobalAnalytics,
    AnalyticsResponse,
    TimeRange
)
from .auth import get_current_user
from ..middleware.subscription import check_feature_access

router = APIRouter()

@router.get("/user-insights", response_model=UserInsights)
async def get_user_insights(
    time_range: TimeRange = TimeRange.MONTH,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check subscription
    check_feature_access("analytics", current_user, db)

    # Calculate time range
    end_date = datetime.utcnow()
    if time_range == TimeRange.WEEK:
        start_date = end_date - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        start_date = end_date - timedelta(days=30)
    else:  # YEAR
        start_date = end_date - timedelta(days=365)

    # Get analytics data
    analytics = db.query(Analytics).filter(
        Analytics.user_id == current_user.id,
        Analytics.created_at >= start_date,
        Analytics.created_at <= end_date
    ).all()

    # Calculate insights
    total_resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).count()

    action_counts = {}
    for action in ActionType:
        count = sum(1 for a in analytics if a.action_type == action)
        action_counts[action.value] = count

    # Calculate average resume score
    avg_score = db.query(func.avg(Resume.score)).filter(
        Resume.user_id == current_user.id,
        Resume.score.isnot(None)
    ).scalar() or 0

    return {
        "total_resumes": total_resumes,
        "action_counts": action_counts,
        "average_score": round(avg_score, 2),
        "time_range": time_range,
        "period_start": start_date,
        "period_end": end_date
    }

@router.get("/global-analytics", response_model=GlobalAnalytics)
async def get_global_analytics(
    time_range: TimeRange = TimeRange.MONTH,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can access global analytics"
        )

    # Calculate time range
    end_date = datetime.utcnow()
    if time_range == TimeRange.WEEK:
        start_date = end_date - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        start_date = end_date - timedelta(days=30)
    else:  # YEAR
        start_date = end_date - timedelta(days=365)

    # Get analytics data
    analytics = db.query(Analytics).filter(
        Analytics.created_at >= start_date,
        Analytics.created_at <= end_date
    ).all()

    # Calculate global metrics
    total_users = db.query(User).count()
    total_resumes = db.query(Resume).count()
    active_users = db.query(User).filter(
        User.last_login >= start_date
    ).count()

    action_counts = {}
    for action in ActionType:
        count = sum(1 for a in analytics if a.action_type == action)
        action_counts[action.value] = count

    # Calculate subscription distribution
    subscription_counts = {
        "free": db.query(User).filter(User.subscription_type == "free").count(),
        "pro": db.query(User).filter(User.subscription_type == "pro").count(),
        "one_time": db.query(User).filter(User.subscription_type == "one_time").count()
    }

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_resumes": total_resumes,
        "action_counts": action_counts,
        "subscription_distribution": subscription_counts,
        "time_range": time_range,
        "period_start": start_date,
        "period_end": end_date
    }

@router.get("/resume-analytics/{resume_id}", response_model=AnalyticsResponse)
async def get_resume_analytics(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if resume exists and belongs to user
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get analytics for this resume
    analytics = db.query(Analytics).filter(
        Analytics.resume_id == resume_id
    ).order_by(Analytics.created_at.desc()).all()

    # Calculate metrics
    action_counts = {}
    for action in ActionType:
        count = sum(1 for a in analytics if a.action_type == action)
        action_counts[action.value] = count

    return {
        "resume_id": resume_id,
        "action_counts": action_counts,
        "analytics": [
            {
                "action_type": a.action_type,
                "created_at": a.created_at,
                "metadata": a.metadata
            }
            for a in analytics
        ]
    } 
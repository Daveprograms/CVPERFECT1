from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, Any
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.resume import Resume, ResumeAnalysis
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard data for the current user
    """
    try:
        # Get user's latest resume
        latest_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(desc(Resume.updated_at)).first()

        # Get resume count
        resume_count = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).count()

        # Get total analyses count
        total_analyses = db.query(ResumeAnalysis).join(Resume).filter(
            Resume.user_id == current_user.id
        ).count()

        # Calculate average score
        avg_score = db.query(func.avg(Resume.score)).filter(
            Resume.user_id == current_user.id,
            Resume.score.isnot(None)
        ).scalar() or 0

        # Prepare latest resume data
        latest_resume_data = None
        if latest_resume:
            latest_analysis = db.query(ResumeAnalysis).filter(
                ResumeAnalysis.resume_id == latest_resume.id
            ).order_by(desc(ResumeAnalysis.created_at)).first()

            latest_resume_data = {
                "id": str(latest_resume.id),
                "filename": latest_resume.filename,
                "score": latest_analysis.overall_score if latest_analysis else 0,
                "ats_score": latest_analysis.ats_score if latest_analysis else 0,
                "updated_at": latest_resume.updated_at.isoformat() if latest_resume.updated_at else None,
            }

        return {
            "user": {
                "id": str(current_user.id),
                "full_name": current_user.full_name,
                "email": current_user.email,
                "onboarding_completed": current_user.onboarding_completed,
                "current_role": current_user.current_role,
                "job_search_status": current_user.job_search_status,
            },
            "latestResume": latest_resume_data,
            "resumeCount": resume_count,
            "totalAnalyses": total_analyses,
            "averageScore": round(avg_score, 1),
        }

    except Exception as e:
        print(f"❌ Dashboard data error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data") 
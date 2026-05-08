import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models.user import User
from ..models.resume import Resume, ResumeAnalysis
from ..core.dependencies import get_current_user
from ..core.config import settings

router = APIRouter()
_log = logging.getLogger(__name__)

@router.get("/")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard data for the current user
    """
    try:
        # Get user's latest resume (model uses upload_date, not updated_at)
        latest_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(desc(Resume.upload_date)).first()

        # Get resume count
        resume_count = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).count()

        # Get total analyses count
        total_analyses = db.query(ResumeAnalysis).join(Resume).filter(
            Resume.user_id == current_user.id
        ).count()

        # Average score lives on ResumeAnalysis, not Resume
        avg_score = (
            db.query(func.avg(ResumeAnalysis.overall_score))
            .join(Resume, ResumeAnalysis.resume_id == Resume.id)
            .filter(Resume.user_id == current_user.id)
            .scalar()
            or 0
        )

        # Prepare latest resume data
        latest_resume_data = None
        if latest_resume:
            latest_analysis = db.query(ResumeAnalysis).filter(
                ResumeAnalysis.resume_id == latest_resume.id
            ).order_by(desc(ResumeAnalysis.created_at)).first()

            latest_resume_data = {
                "id": str(latest_resume.id),
                "filename": latest_resume.filename,
                "score": round(float(latest_analysis.overall_score), 1)
                if latest_analysis and latest_analysis.overall_score is not None
                else None,
                "ats_score": round(float(latest_analysis.ats_score), 1)
                if latest_analysis and latest_analysis.ats_score is not None
                else None,
                "updated_at": latest_resume.upload_date.isoformat()
                if latest_resume.upload_date
                else None,
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
        _log.exception("Dashboard data error: %s", e)
        detail = "Failed to retrieve dashboard data"
        if getattr(settings, "DEBUG", False):
            detail = f"{detail}: {type(e).__name__}: {str(e)[:500]}"
        raise HTTPException(status_code=500, detail=detail)
"""
Job Applications Router
Endpoints for managing job applications
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, JobApplication, ApplicationStatus
from ..schemas.application import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    ApplicationStats,
    ApplicationAnalytics,
    StatusUpdate
)
from ..core.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_model=List[JobApplicationResponse])
async def list_applications(
    status: Optional[ApplicationStatus] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all job applications for the current user"""
    query = db.query(JobApplication).filter(JobApplication.user_id == str(current_user.id))
    
    if status:
        query = query.filter(JobApplication.status == status)
    
    query = query.order_by(JobApplication.applied_date.desc())
    applications = query.offset(offset).limit(limit).all()
    
    return applications


@router.post("/", response_model=JobApplicationResponse, status_code=201)
async def create_application(
    application: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job application"""
    # Verify resume exists if provided
    if application.resume_id:
        from ..models import Resume
        resume = db.query(Resume).filter(
            Resume.id == application.resume_id,
            Resume.user_id == str(current_user.id)
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    
    # Create application
    db_application = JobApplication(
        user_id=str(current_user.id),
        **application.model_dump()
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    return db_application


@router.get("/stats", response_model=ApplicationStats)
async def get_application_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get application statistics for the current user"""
    # Total applications
    total = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == str(current_user.id)
    ).scalar()
    
    # By status
    status_counts = db.query(
        JobApplication.status,
        func.count(JobApplication.id)
    ).filter(
        JobApplication.user_id == str(current_user.id)
    ).group_by(JobApplication.status).all()
    
    by_status = {status.value: count for status, count in status_counts}
    
    # Success rate (offers / total)
    offers = by_status.get(ApplicationStatus.OFFER.value, 0)
    success_rate = (offers / total * 100) if total > 0 else 0
    
    # Average match score
    avg_score = db.query(func.avg(JobApplication.match_score)).filter(
        JobApplication.user_id == str(current_user.id),
        JobApplication.match_score.isnot(None)
    ).scalar()
    
    # Recent applications (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == str(current_user.id),
        JobApplication.applied_date >= thirty_days_ago
    ).scalar()
    
    return ApplicationStats(
        total_applications=total,
        by_status=by_status,
        success_rate=round(success_rate, 2),
        average_match_score=round(avg_score, 2) if avg_score else None,
        recent_applications=recent
    )


@router.put("/{application_id}/status", response_model=JobApplicationResponse)
async def update_application_status(
    application_id: str,
    status_update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update application status"""
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == str(current_user.id)
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status_update.status
    if status_update.notes:
        application.notes = status_update.notes
    
    db.commit()
    db.refresh(application)
    
    return application


@router.get("/analytics", response_model=ApplicationAnalytics)
async def get_application_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed application analytics"""
    # Timeline - applications per month
    timeline_data = db.query(
        extract('year', JobApplication.applied_date).label('year'),
        extract('month', JobApplication.applied_date).label('month'),
        func.count(JobApplication.id).label('count')
    ).filter(
        JobApplication.user_id == str(current_user.id)
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    timeline = [
        {"month": f"{int(year)}-{int(month):02d}", "count": count}
        for year, month, count in timeline_data
    ]
    
    # Top companies
    top_companies_data = db.query(
        JobApplication.company_name,
        func.count(JobApplication.id).label('count')
    ).filter(
        JobApplication.user_id == str(current_user.id)
    ).group_by(JobApplication.company_name).order_by(func.count(JobApplication.id).desc()).limit(10).all()
    
    top_companies = [
        {"company": company, "count": count}
        for company, count in top_companies_data
    ]
    
    # Status distribution
    status_dist = db.query(
        JobApplication.status,
        func.count(JobApplication.id)
    ).filter(
        JobApplication.user_id == str(current_user.id)
    ).group_by(JobApplication.status).all()
    
    status_distribution = {status.value: count for status, count in status_dist}
    
    # Match score distribution
    match_scores = db.query(JobApplication.match_score).filter(
        JobApplication.user_id == str(current_user.id),
        JobApplication.match_score.isnot(None)
    ).all()
    
    score_ranges = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    for (score,) in match_scores:
        if score <= 25:
            score_ranges["0-25"] += 1
        elif score <= 50:
            score_ranges["26-50"] += 1
        elif score <= 75:
            score_ranges["51-75"] += 1
        else:
            score_ranges["76-100"] += 1
    
    return ApplicationAnalytics(
        timeline=timeline,
        top_companies=top_companies,
        status_distribution=status_distribution,
        average_time_to_response=None,  # TODO: Calculate based on status changes
        match_score_distribution=score_ranges
    )


@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a job application"""
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == str(current_user.id)
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    
    return None

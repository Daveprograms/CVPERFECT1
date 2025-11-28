"""
Jobs Router
Endpoints for job search and matching
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User, Job, Resume, JobApplication
from ..schemas.job import (
    JobSearch,
    JobResponse,
    JobMatchRequest,
    JobMatchResponse,
    JobRecommendation
)
from ..routers.auth import get_current_user
from ..services.gemini_service import gemini_service

router = APIRouter()


@router.get("/search", response_model=List[JobResponse])
async def search_jobs(
    keywords: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for jobs with filters
    Note: This searches cached jobs. In production, integrate with job board APIs.
    """
    query = db.query(Job)
    
    # Apply filters
    if keywords:
        search_term = f"%{keywords}%"
        query = query.filter(
            (Job.title.ilike(search_term)) |
            (Job.description.ilike(search_term)) |
            (Job.company.ilike(search_term))
        )
    
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    
    if job_type:
        query = query.filter(Job.job_type == job_type)
    
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))
    
    # Order by most recent
    query = query.order_by(Job.posted_date.desc())
    
    jobs = query.offset(offset).limit(limit).all()
    
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job details by ID"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.post("/match", response_model=JobMatchResponse)
async def match_resume_to_job(
    match_request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Match a resume to a job using AI
    Returns match score and detailed analysis
    """
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == match_request.resume_id,
        Resume.user_id == str(current_user.id)
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Get job description
    if match_request.job_id:
        job = db.query(Job).filter(Job.id == match_request.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_description = job.description
        job_title = job.title
        company_name = job.company
    elif match_request.job_description:
        job_description = match_request.job_description
        job_title = match_request.job_title or "Position"
        company_name = match_request.company_name or "Company"
    else:
        raise HTTPException(
            status_code=400,
            detail="Either job_id or job_description must be provided"
        )
    
    # Use Gemini to match resume to job
    try:
        match_result = await gemini_service.match_resume_to_job(
            resume_content=resume.content,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name
        )
        
        return match_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error matching resume to job: {str(e)}"
        )


@router.get("/recommendations", response_model=List[JobRecommendation])
async def get_job_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized job recommendations based on user's resume
    """
    # Get user's most recent resume
    resume = db.query(Resume).filter(
        Resume.user_id == str(current_user.id)
    ).order_by(Resume.created_at.desc()).first()
    
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first."
        )
    
    # Get available jobs (excluding already applied)
    applied_job_ids = db.query(JobApplication.job_url).filter(
        JobApplication.user_id == str(current_user.id)
    ).all()
    applied_urls = [url for (url,) in applied_job_ids if url]
    
    query = db.query(Job)
    if applied_urls:
        query = query.filter(~Job.job_url.in_(applied_urls))
    
    jobs = query.order_by(Job.posted_date.desc()).limit(limit * 2).all()
    
    # Match each job and return top recommendations
    recommendations = []
    
    for job in jobs:
        try:
            match_result = await gemini_service.match_resume_to_job(
                resume_content=resume.content,
                job_description=job.description,
                job_title=job.title,
                company_name=job.company
            )
            
            if match_result.match_score >= 60:  # Only recommend good matches
                recommendations.append(
                    JobRecommendation(
                        job=job,
                        match_score=match_result.match_score,
                        reason=match_result.overall_assessment
                    )
                )
        except Exception:
            continue  # Skip jobs that fail to match
    
    # Sort by match score and return top N
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    
    return recommendations[:limit]

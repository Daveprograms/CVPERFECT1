"""
Job Schemas
Pydantic schemas for job search and matching endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class JobType(str, Enum):
    """Job type enum"""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class JobSource(str, Enum):
    """Job source enum"""
    MANUAL = "manual"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"
    COMPANY_WEBSITE = "company_website"


class JobSearch(BaseModel):
    """Schema for job search parameters"""
    keywords: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    company: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class JobResponse(BaseModel):
    """Schema for job details response"""
    id: str
    title: str
    company: str
    description: str
    location: Optional[str]
    salary_range: Optional[str]
    job_type: JobType
    source: JobSource
    job_url: Optional[str]
    posted_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobMatchRequest(BaseModel):
    """Schema for job matching request"""
    resume_id: str
    job_id: Optional[str] = None
    job_description: Optional[str] = None  # If job not in DB
    job_title: Optional[str] = None
    company_name: Optional[str] = None


class JobMatchResponse(BaseModel):
    """Schema for job match results"""
    match_score: float = Field(..., ge=0, le=100)
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]
    overall_assessment: str
    key_skills_matched: list[str]
    missing_skills: list[str]


class JobRecommendation(BaseModel):
    """Schema for job recommendation"""
    job: JobResponse
    match_score: float
    reason: str

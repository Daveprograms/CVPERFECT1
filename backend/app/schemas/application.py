"""
Job Application Schemas
Pydantic schemas for job application endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    """Application status enum"""
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplicationCreate(BaseModel):
    """Schema for creating a job application"""
    company_name: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)
    job_url: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    notes: Optional[str] = None
    resume_id: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    """Schema for updating a job application"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    job_title: Optional[str] = Field(None, min_length=1, max_length=200)
    job_url: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    match_score: Optional[float] = Field(None, ge=0, le=100)


class JobApplicationResponse(BaseModel):
    """Schema for job application response"""
    id: str
    user_id: str
    company_name: str
    job_title: str
    job_url: Optional[str]
    location: Optional[str]
    salary_range: Optional[str]
    status: ApplicationStatus
    applied_date: datetime
    match_score: Optional[float]
    notes: Optional[str]
    resume_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApplicationStats(BaseModel):
    """Schema for application statistics"""
    total_applications: int
    by_status: dict[str, int]
    success_rate: float  # Percentage of offers vs total
    average_match_score: Optional[float]
    recent_applications: int  # Last 30 days


class ApplicationAnalytics(BaseModel):
    """Schema for detailed application analytics"""
    timeline: list[dict]  # Applications over time
    top_companies: list[dict]  # Most applied companies
    status_distribution: dict[str, int]
    average_time_to_response: Optional[float]  # Days
    match_score_distribution: dict[str, int]  # Score ranges


class StatusUpdate(BaseModel):
    """Schema for updating application status"""
    status: ApplicationStatus
    notes: Optional[str] = None

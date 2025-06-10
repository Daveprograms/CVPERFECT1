from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResumeBase(BaseModel):
    job_description: Optional[str] = None
    linkedin_url: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeVersionBase(BaseModel):
    content: str
    version_number: int

class ResumeVersionCreate(ResumeVersionBase):
    pass

class ResumeVersionResponse(ResumeVersionBase):
    id: int
    resume_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    original_content: str
    enhanced_content: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[Dict[str, Any]] = None
    extracted_info: Optional[Dict[str, Any]] = None
    job_matches: Optional[List[Dict[str, Any]]] = None
    improvements: Optional[List[Dict[str, Any]]] = None
    cover_letter: Optional[str] = None
    learning_path: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    versions: List[ResumeVersionResponse] = []

    class Config:
        from_attributes = True

class ResumeEnhanceRequest(BaseModel):
    job_description: Optional[str] = None

class ResumeScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: Dict[str, Any]
    improvements: List[Dict[str, Any]]
    extracted_info: Dict[str, Any]
    job_matches: List[Dict[str, Any]]

class CoverLetterRequest(BaseModel):
    job_description: str
    company_info: Optional[Dict[str, Any]] = None

class CoverLetterResponse(BaseModel):
    cover_letter: str

class LinkedInProfileResponse(BaseModel):
    skills: List[str]
    experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    languages: List[str]
    interests: List[str]

class ResumeSnapshotResponse(BaseModel):
    score: float
    feedback_summary: str
    learning_suggestions_summary: str
    image_url: str
    share_text: str

class LearningPathResponse(BaseModel):
    skills: List[Dict[str, Any]]
    resources: List[Dict[str, Any]]
    timeline: Dict[str, Any]
    milestones: List[Dict[str, Any]] 
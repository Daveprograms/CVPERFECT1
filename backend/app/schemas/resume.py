from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResumeBase(BaseModel):
    content: str
    job_description: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeEnhanceRequest(BaseModel):
    resume_id: int
    job_description: Optional[str] = None

class CoverLetterRequest(BaseModel):
    resume_id: int
    job_description: str
    company_name: str
    position: str

class CoverLetterResponse(BaseModel):
    cover_letter: str

class ResumeScoreResponse(BaseModel):
    score: float
    feedback: Dict[str, Any]
    learning_suggestions: List[Dict[str, Any]]

class ResumeVersionResponse(BaseModel):
    id: int
    version_number: int
    content: str
    created_at: datetime
    changes: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ResumeResponse(ResumeBase):
    id: int
    user_id: str
    enhanced_content: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[Dict[str, Any]] = None
    learning_suggestions: Optional[List[Dict[str, Any]]] = None
    cover_letter: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    download_count: int
    is_public: bool
    public_id: Optional[str] = None
    versions: List[ResumeVersionResponse] = []

    class Config:
        from_attributes = True

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
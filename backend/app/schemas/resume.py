from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ResumeBase(BaseModel):
    job_description: Optional[str] = None


class ResumeCreate(ResumeBase):
    pass

class ResumeVersionBase(BaseModel):
    content: str
    version_number: int

class ResumeVersionCreate(ResumeVersionBase):
    pass

class ResumeVersionResponse(ResumeVersionBase):
    id: UUID
    resume_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeResponse(ResumeBase):
    id: UUID
    user_id: UUID
    filename: str
    content: str
    file_type: Optional[str] = None
    processing_status: Optional[str] = None
    character_count: Optional[int] = None
    created_at: datetime

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
from pydantic import BaseModel, HttpUrl, Field, ConfigDict
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
    id: int
    resume_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeResponse(ResumeBase):
    """
    Serialized `models.resume.Resume` for GET /api/resume/{id} and GET /api/resume/list.
    Must match the SQLAlchemy columns (UUID ids, `content`, etc.).
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    filename: str
    content: str
    file_type: str
    character_count: int = 0
    upload_date: Optional[datetime] = None
    processing_status: Optional[str] = "pending"

class ResumeContentUpdate(BaseModel):
    content: str


class ResumeEnhanceRequest(BaseModel):
    job_description: Optional[str] = None

class ResumeScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: Dict[str, Any]
    improvements: List[Dict[str, Any]]
    extracted_info: Dict[str, Any]
    job_matches: List[Dict[str, Any]]

class CoverLetterRequest(BaseModel):
    """Used for cover letter, learning path, and practice exam; extra fields ignored where unused."""

    model_config = ConfigDict(extra="ignore")

    job_description: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
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
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
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    company_info: Optional[Dict[str, Any]] = None

class CoverLetterResponse(BaseModel):
    cover_letter: str


class CoverLetterUpdateRequest(BaseModel):
    content: str



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


class GeneratedResumeTemplateResponse(BaseModel):
    id: UUID
    key: str
    label: str
    description: Optional[str] = None
    preview_meta: Dict[str, Any] = {}
    sort_order: int

    class Config:
        from_attributes = True


class GeneratedResumeCreateRequest(BaseModel):
    title: Optional[str] = "Untitled Generated Resume"
    template_key: Optional[str] = None
    resume_data: Dict[str, Any] = {}
    quick_import_input: Optional[str] = None


class GeneratedResumeUpdateRequest(BaseModel):
    title: Optional[str] = None
    template_key: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None
    quick_import_input: Optional[str] = None
    status: Optional[str] = None


class GeneratedResumeSummaryRequest(BaseModel):
    current_role: Optional[str] = None
    years_experience: Optional[str] = None
    specialization: Optional[str] = None
    highlights: List[str] = []
    target_role: Optional[str] = None
    target_company_type: Optional[str] = None


class GeneratedResumeAIGenerateRequest(BaseModel):
    quick_import_input: Optional[str] = None
    target_role: Optional[str] = None
    target_company_type: Optional[str] = None
    job_description: Optional[str] = None


class GeneratedResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    template_key: Optional[str] = None
    title: str
    status: str
    resume_data: Dict[str, Any]
    quick_import_input: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

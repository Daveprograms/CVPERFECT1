"""
Interview Schemas
Pydantic schemas for interview preparation endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SessionType(str, Enum):
    """Session type enum"""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    MIXED = "mixed"
    SYSTEM_DESIGN = "system_design"


class SessionStatus(str, Enum):
    """Session status enum"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class QuestionType(str, Enum):
    """Question type enum"""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"


class QuestionDifficulty(str, Enum):
    """Question difficulty enum"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionGenerateRequest(BaseModel):
    """Schema for generating practice questions"""
    job_title: str = Field(..., min_length=1, max_length=200)
    company_name: Optional[str] = None
    resume_id: Optional[str] = None
    question_type: Optional[QuestionType] = None
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
    count: int = Field(default=5, ge=1, le=20)


class GeneratedQuestion(BaseModel):
    """Schema for a generated question"""
    question_text: str
    question_type: QuestionType
    difficulty: QuestionDifficulty
    category: str
    hints: List[str]
    sample_answer: str


class QuestionGenerateResponse(BaseModel):
    """Schema for question generation response"""
    questions: List[GeneratedQuestion]
    total_count: int


class InterviewSessionCreate(BaseModel):
    """Schema for creating an interview session"""
    job_title: str = Field(..., min_length=1, max_length=200)
    company_name: Optional[str] = None
    session_type: SessionType = SessionType.MIXED
    resume_id: Optional[str] = None


class InterviewQuestionResponse(BaseModel):
    """Schema for interview question response"""
    id: str
    question_text: str
    question_type: QuestionType
    difficulty: QuestionDifficulty
    category: Optional[str]
    hints: Optional[List[str]]
    user_answer: Optional[str]
    ai_feedback: Optional[dict]
    score: Optional[float]
    
    class Config:
        from_attributes = True


class InterviewSessionResponse(BaseModel):
    """Schema for interview session response"""
    id: str
    user_id: str
    job_title: str
    company_name: Optional[str]
    session_type: SessionType
    duration: Optional[int]
    total_questions: int
    questions_answered: int
    overall_score: Optional[float]
    status: SessionStatus
    feedback: Optional[dict]
    started_at: datetime
    completed_at: Optional[datetime]
    questions: Optional[List[InterviewQuestionResponse]] = None
    
    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    """Schema for submitting an answer"""
    question_id: str
    answer: str = Field(..., min_length=1)


class AnswerFeedback(BaseModel):
    """Schema for answer feedback"""
    score: float = Field(..., ge=0, le=100)
    strengths: List[str]
    improvements: List[str]
    detailed_feedback: str
    suggested_answer: Optional[str]


class SessionFeedback(BaseModel):
    """Schema for overall session feedback"""
    overall_score: float = Field(..., ge=0, le=100)
    strengths: List[str]
    areas_for_improvement: List[str]
    question_breakdown: List[dict]
    recommendations: List[str]
    next_steps: List[str]


class InterviewTips(BaseModel):
    """Schema for interview tips"""
    job_role: str
    general_tips: List[str]
    technical_tips: Optional[List[str]]
    behavioral_tips: Optional[List[str]]
    common_questions: List[str]
    preparation_checklist: List[str]


class CompanyPrep(BaseModel):
    """Schema for company-specific preparation"""
    company_name: str
    company_overview: str
    culture_insights: List[str]
    interview_process: List[str]
    common_questions: List[str]
    tips: List[str]
    resources: List[dict]

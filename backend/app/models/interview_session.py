"""
Interview Session Model
Tracks mock interview sessions and their results
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from ..database import Base


class SessionType(str, enum.Enum):
    """Interview session type enum"""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    MIXED = "mixed"
    SYSTEM_DESIGN = "system_design"


class SessionStatus(str, enum.Enum):
    """Session status enum"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class InterviewSession(Base):
    """Interview session model for tracking mock interviews"""
    __tablename__ = "interview_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Session details
    job_title = Column(String, nullable=False)
    company_name = Column(String)
    session_type = Column(SQLEnum(SessionType), default=SessionType.MIXED, nullable=False)
    
    # Session metrics
    duration = Column(Integer)  # Duration in minutes
    total_questions = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    overall_score = Column(Float)  # 0-100 score
    
    # Status and feedback
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False)
    feedback = Column(JSON)  # Detailed feedback from AI
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<InterviewSession {self.job_title} - {self.status}>"

"""
Job Application Model
Tracks user job applications and their status
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from ..database import Base


class ApplicationStatus(str, enum.Enum):
    """Application status enum"""
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplication(Base):
    """Job Application model"""
    __tablename__ = "job_applications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Job details
    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    job_url = Column(String)
    location = Column(String)
    salary_range = Column(String)
    
    # Application tracking
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    applied_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # AI matching
    match_score = Column(Float)  # 0-100 score from AI matching
    
    # User notes and resume used
    notes = Column(Text)
    resume_id = Column(String, ForeignKey("resumes.id"))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="job_applications")
    resume = relationship("Resume")
    
    def __repr__(self):
        return f"<JobApplication {self.company_name} - {self.job_title} ({self.status})>"

from sqlalchemy import Column, String, DateTime, Text, Integer, Float, JSON, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from ..database import Base
import uuid


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = synonym("upload_date")
    processing_status = Column(String, default="pending")
    character_count = Column(Integer, default=0)
    
    # Relationships
    analyses = relationship("ResumeAnalysis", back_populates="resume")
    analytics = relationship("Analytics", back_populates="resume")
    user = relationship("User", back_populates="resumes")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_current = Column(Boolean, default=False)


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    ats_score = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    analysis_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    resume = relationship("Resume", back_populates="analyses")


# Request schema for analysis
class ResumeAnalysisRequest(BaseModel):
    resume_id: str
    job_description: Optional[str] = None
    analysis_type: str = "ai_feedback" 
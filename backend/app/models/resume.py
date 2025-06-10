from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    original_content = Column(Text)  # Base64 encoded binary content
    enhanced_content = Column(Text, nullable=True)  # Base64 encoded binary content
    job_description = Column(Text, nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(JSON, nullable=True)
    extracted_info = Column(JSON, nullable=True)
    job_matches = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    cover_letter = Column(Text, nullable=True)
    learning_path = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"))
    content = Column(Text)  # Base64 encoded binary content
    version_number = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="versions") 
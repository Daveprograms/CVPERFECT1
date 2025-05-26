from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    original_content = Column(Text, nullable=False)
    enhanced_content = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(JSON, nullable=True)
    learning_suggestions = Column(JSON, nullable=True)
    linkedin_url = Column(String, nullable=True)
    cover_letter = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    download_count = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    public_id = Column(String, unique=True, nullable=True)  # For sharing

    # Relationships
    user = relationship("User", back_populates="resumes")
    analytics = relationship("Analytics", back_populates="resume")

    def __repr__(self):
        return f"<Resume {self.id} for user {self.user_id}>"

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    content = Column(Text, nullable=False)
    version_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    changes = Column(JSON, nullable=True)  # Store what changed in this version

    # Relationships
    resume = relationship("Resume")

    def __repr__(self):
        return f"<ResumeVersion {self.version_number} for resume {self.resume_id}>" 
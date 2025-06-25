from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum
from datetime import datetime
import uuid

from .user import User
from .resume import Resume

class ActionType(str, enum.Enum):
    RESUME_UPLOAD = "resume_upload"
    RESUME_ANALYSIS = "resume_analysis"
    RESUME_ENHANCE = "resume_enhance"
    COVER_LETTER_GENERATION = "cover_letter_generation"
    LEARNING_PATH_GENERATION = "learning_path_generation"
    PRACTICE_EXAM_GENERATION = "practice_exam_generation"

    JOB_MATCH = "job_match"
    RESUME_DOWNLOAD = "resume_download"
    RESUME_SHARE = "resume_share"

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id"), nullable=True)
    action_type = Column(Enum(ActionType))
    meta_data = Column(JSON, nullable=True)  # ✅ Fixed
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="analytics")
    resume = relationship("Resume", back_populates="analytics")

    def __repr__(self):
        return f"<Analytics(id={self.id}, user_id={self.user_id}, action_type={self.action_type})>"


class DeveloperCode(Base):
    __tablename__ = "developer_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    used_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<DeveloperCode {self.code}>" 
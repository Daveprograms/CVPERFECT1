from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum
from datetime import datetime

from .user import User
from .resume import Resume

class ActionType(str, enum.Enum):
    RESUME_UPLOAD = "resume_upload"
    RESUME_ENHANCE = "resume_enhance"
    RESUME_DOWNLOAD = "resume_download"
    RESUME_DELETE = "resume_delete"
    COVER_LETTER_GENERATE = "cover_letter_generate"
    LINKEDIN_OPTIMIZE = "linkedin_optimize"
    SUBSCRIPTION_CHANGE = "subscription_change"
    DEVELOPER_CODE_USE = "developer_code_use"

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    action_type = Column(Enum(ActionType), nullable=False)
    metadata = Column(JSON, nullable=True)  # Store additional action-specific data
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="analytics")
    resume = relationship("Resume", back_populates="analytics")

    def __repr__(self):
        return f"<Analytics(id={self.id}, user_id={self.user_id}, action_type={self.action_type})>"

class DeveloperCode(Base):
    __tablename__ = "developer_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    used_by = Column(String, ForeignKey("users.id"), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<DeveloperCode {self.code}>" 
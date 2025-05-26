from sqlalchemy import Column, String, JSON, DateTime, func, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    firebase_uid = Column(String, unique=True)
    password = Column(String, nullable=True)
    subscription = Column(JSON, nullable=False, default={
        "status": "inactive",
        "plan": "free",
        "expiresAt": None
    })
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    resumes = relationship("Resume", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    enhanced_content = Column(String)
    score = Column(Integer)
    feedback = Column(String)
    learning_plan = Column(JSON)
    job_description = Column(String)
    downloaded = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="resumes") 
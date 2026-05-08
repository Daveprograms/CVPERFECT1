import enum
import uuid

from sqlalchemy import Column, String, SmallInteger, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class BackgroundJobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"


class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    job_type = Column(String(64), nullable=False)
    payload = Column(JSONB, nullable=False)
    status = Column(SQLEnum(BackgroundJobStatus), nullable=False, default=BackgroundJobStatus.QUEUED, index=True)

    priority = Column(SmallInteger, nullable=False, default=100)
    attempts = Column(SmallInteger, nullable=False, default=0)
    max_attempts = Column(SmallInteger, nullable=False, default=5)

    last_error = Column(Text, nullable=True)
    worker_id = Column(String(64), nullable=True)

    locked_at = Column(DateTime(timezone=True), nullable=True)
    available_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    related_resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True)
    related_variant_id = Column(UUID(as_uuid=True), ForeignKey("resume_variants.id", ondelete="CASCADE"), nullable=True)

    user = relationship("User")
    resume = relationship("Resume")
    variant = relationship("ResumeVariant")


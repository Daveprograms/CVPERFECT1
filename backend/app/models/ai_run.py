import enum
import uuid

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class AIRunKind(str, enum.Enum):
    RESUME_ANALYZE = "resume_analyze"
    RESUME_ENHANCE = "resume_enhance"
    RESUME_TAILOR = "resume_tailor"
    RESUME_PARSE = "resume_parse"
    COVER_LETTER_OUTLINE = "cover_letter_outline"
    COVER_LETTER_WRITE = "cover_letter_write"
    LEARNING_PATH = "learning_path"
    PRACTICE_EXAM = "practice_exam"
    JOB_MATCH = "job_match"
    INTERVIEW_QUESTION = "interview_question"
    INTERVIEW_FEEDBACK = "interview_feedback"
    CHAT = "chat"


class AIRunStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"


class AIRun(Base):
    __tablename__ = "ai_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    kind = Column(SQLEnum(AIRunKind), nullable=False, index=True)
    status = Column(SQLEnum(AIRunStatus), nullable=False, default=AIRunStatus.QUEUED)

    provider = Column(String(32), nullable=False)
    model = Column(String(64), nullable=False)
    prompt_hash = Column(String(64), nullable=False)

    request_payload = Column(JSONB, nullable=True)
    response_payload = Column(JSONB, nullable=True)

    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    cost_usd = Column(Numeric(10, 6), nullable=True)

    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)

    resume_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
    )
    resume_variant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resume_variants.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_description_id = Column(
        UUID(as_uuid=True),
        ForeignKey("job_descriptions.id", ondelete="SET NULL"),
        nullable=True,
    )
    background_job_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    resume = relationship("Resume", foreign_keys=[resume_id])
    resume_variant = relationship("ResumeVariant", foreign_keys=[resume_variant_id])
    job_description = relationship("JobDescription", foreign_keys=[job_description_id])


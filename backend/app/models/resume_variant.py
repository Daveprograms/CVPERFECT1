import enum
import uuid

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class ResumeVariantKind(str, enum.Enum):
    MASTER = "master"
    ENHANCED = "enhanced"
    TAILORED = "tailored"
    MANUAL_EDIT = "manual_edit"


class ResumeVariant(Base):
    __tablename__ = "resume_variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_id = Column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_variant_id = Column(UUID(as_uuid=True), ForeignKey("resume_variants.id", ondelete="SET NULL"), nullable=True)
    job_description_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True, index=True)

    template_id = Column(UUID(as_uuid=True), ForeignKey("resume_templates.id", ondelete="SET NULL"), nullable=True)
    theme_id = Column(UUID(as_uuid=True), ForeignKey("resume_themes.id", ondelete="SET NULL"), nullable=True)

    kind = Column(SQLEnum(ResumeVariantKind), nullable=False)
    label = Column(String(128), nullable=True)
    version_number = Column(Integer, nullable=False)

    content_json = Column(JSONB, nullable=False)
    content_hash = Column(String(64), nullable=False)

    is_current = Column(Boolean, nullable=False, default=False)
    ai_run_id = Column(UUID(as_uuid=True), ForeignKey("ai_runs.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    resume = relationship("Resume", foreign_keys=[resume_id])
    parent_variant = relationship("ResumeVariant", remote_side=[id])
    job_description = relationship("JobDescription")
    template = relationship("ResumeTemplate")
    theme = relationship("ResumeTheme")
    ai_run = relationship("AIRun", foreign_keys=[ai_run_id])


import enum
import uuid

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class ExportFormat(str, enum.Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    JSON = "json"


class ExportStatus(str, enum.Enum):
    QUEUED = "queued"
    RENDERING = "rendering"
    DONE = "done"
    FAILED = "failed"


class ResumeExport(Base):
    __tablename__ = "resume_exports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_variant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resume_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id = Column(UUID(as_uuid=True), ForeignKey("resume_templates.id", ondelete="SET NULL"), nullable=True)
    theme_id = Column(UUID(as_uuid=True), ForeignKey("resume_themes.id", ondelete="SET NULL"), nullable=True)

    format = Column(SQLEnum(ExportFormat), nullable=False)
    status = Column(SQLEnum(ExportStatus), nullable=False, default=ExportStatus.QUEUED)

    storage_key = Column(Text, nullable=True)
    byte_size = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)

    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
    resume_variant = relationship("ResumeVariant")
    template = relationship("ResumeTemplate")
    theme = relationship("ResumeTheme")


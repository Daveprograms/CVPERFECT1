from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..database import Base


class ResumeTheme(Base):
    __tablename__ = "resume_themes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resume_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug = Column(String(64), nullable=False)
    palette = Column(JSONB, nullable=False)
    is_default = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    template = relationship("ResumeTemplate", back_populates="themes")


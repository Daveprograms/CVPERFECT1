from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..database import Base


class ResumeTemplate(Base):
    __tablename__ = "resume_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(64), nullable=False, unique=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    tier_required = Column(String(32), nullable=False, default="free")

    # Which renderer consumes this template definition (e.g. html_chromium, docx).
    layout_engine = Column(String(32), nullable=False)
    # Renderer-specific template definition (design-only).
    layout_data = Column(JSONB, nullable=False)

    preview_url = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    themes = relationship("ResumeTheme", back_populates="template", cascade="all, delete-orphan")


"""
Watchlist / Dream Companies Model
Users can track companies they want to work at and get job alerts
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class DreamCompany(Base):
    """Dream company watchlist entry"""
    __tablename__ = "dream_companies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)

    # Company info
    company_name = Column(String, nullable=False)
    company_url = Column(String, nullable=True)
    company_logo = Column(String, nullable=True)
    industry = Column(String, nullable=True)

    # User's notes about why they want to work there
    reasons = Column(Text, nullable=True)
    target_roles = Column(JSON, default=[])  # list of job titles they want

    # Alert settings
    alert_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<DreamCompany {self.company_name} for user {self.user_id}>"

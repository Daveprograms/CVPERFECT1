from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..database import Base

class SubscriptionType(str, enum.Enum):
    FREE = "free"
    ONE_TIME = "one_time"
    PRO = "pro"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    subscription_type = Column(Enum(SubscriptionType), default=SubscriptionType.FREE)
    remaining_enhancements = Column(Integer, default=0)  # For one-time users
    subscription_end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = Column(JSON, default={})

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>" 
from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from ..database import Base

class SubscriptionType(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    ONE_TIME = "one_time"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    stripe_customer_id = Column(String, unique=True, index=True, nullable=True)
    subscription_type = Column(Enum(SubscriptionType), default=SubscriptionType.FREE)
    remaining_enhancements = Column(Integer, default=0)  # For one-time users
    subscription_end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = Column(JSON, default={})
    
    # Upload tracking
    uploads_count = Column(Integer, default=0)
    last_upload_reset = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete-orphan")

    def get_upload_limit(self):
        """Get the upload limit for the user's subscription type"""
        limits = {
            SubscriptionType.FREE: 1,
            SubscriptionType.BASIC: 10,
            SubscriptionType.PROFESSIONAL: 25,
            SubscriptionType.ENTERPRISE: 50,
            SubscriptionType.ONE_TIME: 1
        }
        return limits.get(self.subscription_type, 1)
    
    def can_upload(self):
        """Check if user can upload based on their subscription"""
        # TEMPORARILY ALWAYS ALLOW UPLOADS FOR FREE TESTING
        return True
        # Reset monthly count if needed (simplified logic)
        # current_limit = self.get_upload_limit()
        # if self.subscription_type == SubscriptionType.FREE:
        #     # Weekly limit for free users
        #     return self.uploads_count < current_limit
        # return self.uploads_count < current_limit
    
    def get_subscription_features(self):
        """Get features available for the user's subscription"""
        features = {
            SubscriptionType.FREE: {
                "resume_uploads": 1,
                "ai_analysis": True,
                "ai_scans_per_week": 1,
                "pdf_export": True,
                "docx_export": False,
                "resume_templates": 0,
                "job_matching": False,
                "premium_chat": False,
                "versioning": False,
                "auto_apply": False,
                "priority_processing": False,
                "learning_plans": False,
                "api_access": False
            },
            SubscriptionType.BASIC: {
                "resume_uploads": 10,
                "ai_analysis": True,
                "ai_scans_per_week": -1,  # Unlimited
                "pdf_export": True,
                "docx_export": True,
                "resume_templates": 10,
                "job_matching": False,
                "premium_chat": False,
                "versioning": True,
                "auto_apply": False,
                "priority_processing": False,
                "learning_plans": False,
                "api_access": False
            },
            SubscriptionType.PROFESSIONAL: {
                "resume_uploads": 25,
                "ai_analysis": True,
                "ai_scans_per_week": -1,  # Unlimited
                "pdf_export": True,
                "docx_export": True,
                "resume_templates": -1,  # All templates
                "job_matching": True,
                "premium_chat": True,
                "versioning": True,
                "auto_apply": False,
                "priority_processing": False,
                "learning_plans": False,
                "api_access": False
            },
            SubscriptionType.ENTERPRISE: {
                "resume_uploads": 50,
                "ai_analysis": True,
                "ai_scans_per_week": -1,  # Unlimited
                "pdf_export": True,
                "docx_export": True,
                "resume_templates": -1,  # All templates
                "job_matching": True,
                "premium_chat": True,
                "versioning": True,
                "auto_apply": True,
                "priority_processing": True,
                "learning_plans": True,
                "api_access": True
            }
        }
        return features.get(self.subscription_type, features[SubscriptionType.FREE])

    def __repr__(self):
        return f"<User {self.email}>" 
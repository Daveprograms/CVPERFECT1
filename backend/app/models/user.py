from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class SubscriptionType(str, enum.Enum):
    FREE = "free"
    ONE_TIME = "one_time"
    PRO = "pro"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    subscription_type = Column(Enum(SubscriptionType), default=SubscriptionType.FREE)
    subscription_end_date = Column(DateTime, nullable=True)
    remaining_enhancements = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    stripe_customer_id = Column(String, unique=True, nullable=True)

    # Relationships
    resumes = relationship("Resume", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>" 
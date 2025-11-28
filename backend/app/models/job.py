"""
Job Model
Caches job listings from external sources
"""
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from datetime import datetime
import enum
import uuid

from ..database import Base


class JobType(str, enum.Enum):
    """Job type enum"""
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class JobSource(str, enum.Enum):
    """Job source enum"""
    MANUAL = "manual"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    GLASSDOOR = "glassdoor"
    COMPANY_WEBSITE = "company_website"


class Job(Base):
    """Job listing model for caching external jobs"""
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Job details
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String)
    salary_range = Column(String)
    
    # Job metadata
    job_type = Column(SQLEnum(JobType), default=JobType.FULL_TIME)
    source = Column(SQLEnum(JobSource), default=JobSource.MANUAL, nullable=False)
    external_id = Column(String)  # ID from external source
    job_url = Column(String)
    
    # Dates
    posted_date = Column(DateTime)
    expires_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Job {self.company} - {self.title}>"

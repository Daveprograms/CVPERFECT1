from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from enum import Enum

class ActionType(str, Enum):
    RESUME_UPLOAD = "resume_upload"
    RESUME_ENHANCE = "resume_enhance"
    RESUME_DOWNLOAD = "resume_download"
    RESUME_DELETE = "resume_delete"
    COVER_LETTER_GENERATE = "cover_letter_generate"
    LINKEDIN_OPTIMIZE = "linkedin_optimize"
    SUBSCRIPTION_CHANGE = "subscription_change"

class ActivityItem(BaseModel):
    type: ActionType
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    resume: Optional[Dict[str, Any]] = None

class VersionInfo(BaseModel):
    version_number: int
    created_at: datetime
    changes: Dict[str, Any]

class UserInsightsResponse(BaseModel):
    total_resumes: int
    total_enhancements: int
    total_downloads: int
    average_score: float
    action_distribution: Dict[str, int]
    recent_activity: List[ActivityItem]

class ResumeInsightsResponse(BaseModel):
    resume_id: int
    score: Optional[float]
    total_enhancements: int
    total_downloads: int
    last_enhancement: Optional[datetime]
    last_download: Optional[datetime]
    versions: List[VersionInfo]
    feedback: Optional[Dict[str, Any]]
    learning_suggestions: Optional[List[str]]

class DailyActivity(BaseModel):
    date: date
    enhancements: int
    downloads: int

class GlobalStatsResponse(BaseModel):
    total_users: int
    total_resumes: int
    total_enhancements_30d: int
    total_downloads_30d: int
    average_score: float
    subscription_distribution: Dict[str, int]
    daily_activity: List[DailyActivity] 
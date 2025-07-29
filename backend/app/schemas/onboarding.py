from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class OnboardingData(BaseModel):
    current_role: str
    job_search_status: str
    internship_date_range: Optional[str] = None
    preferred_job_types: List[str] = []
    top_technologies: List[str] = []
    help_needed: List[str] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class OnboardingResponse(BaseModel):
    success: bool
    message: str
    user_id: str 
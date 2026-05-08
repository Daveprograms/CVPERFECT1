from typing import List, Optional

from pydantic import BaseModel, Field


class OnboardingData(BaseModel):
    current_role: str
    job_search_status: str
    internship_date_range: Optional[str] = None
    preferred_job_types: List[str] = Field(default_factory=list)
    top_technologies: List[str] = Field(default_factory=list)
    help_needed: List[str] = Field(default_factory=list)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class OnboardingResponse(BaseModel):
    success: bool
    message: str
    user_id: str 
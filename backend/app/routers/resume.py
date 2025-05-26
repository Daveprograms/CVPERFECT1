from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import google.generativeai as genai
from ..database import get_db
from sqlalchemy.orm import Session
from ..models import User, Resume
from .auth import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/resume", tags=["resume"])

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

# Models
class ResumeAnalysis(BaseModel):
    content: str
    job_description: Optional[str] = None

class ResumeScore(BaseModel):
    score: int
    feedback: str
    learning_plan: dict

class ResumeHistory(BaseModel):
    id: str
    content: str
    score: int
    created_at: datetime
    job_description: Optional[str]

class DeveloperCode(BaseModel):
    code: str

# Helper functions
def analyze_resume_with_ai(content: str, job_description: Optional[str] = None) -> str:
    prompt = f"""
    Analyze this resume and provide specific improvements:
    {content}
    
    {f'Optimize it for this job description: {job_description}' if job_description else ''}
    
    Focus on:
    1. Action verbs and quantifiable achievements
    2. Skills alignment
    3. Format and structure
    4. Professional tone
    """
    
    response = model.generate_content(prompt)
    return response.text

def score_resume_with_ai(content: str) -> ResumeScore:
    prompt = f"""
    Score this resume from 1-10 and provide detailed feedback:
    {content}
    
    Include:
    1. Overall score
    2. Strengths
    3. Areas for improvement
    4. Learning plan with specific resources
    """
    
    response = model.generate_content(prompt)
    # Parse response and structure it
    # This is a simplified version - you'll need to parse the AI response properly
    return ResumeScore(
        score=8,  # Example score
        feedback=response.text,
        learning_plan={
            "resources": ["Resource 1", "Resource 2"],
            "timeline": "2 weeks",
            "focus_areas": ["Area 1", "Area 2"]
        }
    )

# Routes
@router.post("/analyze")
async def analyze_resume(
    data: ResumeAnalysis,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check subscription status
    if current_user.subscription["status"] != "active":
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    # Analyze resume
    enhanced_content = analyze_resume_with_ai(data.content, data.job_description)
    
    # Save to history
    resume = Resume(
        user_id=current_user.id,
        content=data.content,
        enhanced_content=enhanced_content,
        job_description=data.job_description
    )
    db.add(resume)
    db.commit()
    
    return {"enhanced_content": enhanced_content}

@router.post("/score")
async def score_resume(
    data: ResumeAnalysis,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check subscription status
    if current_user.subscription["status"] != "active":
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    # Score resume
    score_result = score_resume_with_ai(data.content)
    
    # Save to history
    resume = Resume(
        user_id=current_user.id,
        content=data.content,
        score=score_result.score,
        feedback=score_result.feedback,
        learning_plan=score_result.learning_plan,
        job_description=data.job_description
    )
    db.add(resume)
    db.commit()
    
    return score_result

@router.get("/history", response_model=List[ResumeHistory])
async def get_resume_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    return resumes

@router.post("/developer-code")
async def activate_developer_code(
    data: DeveloperCode,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if code is valid
    if data.code != os.getenv("DEVELOPER_CODE"):
        raise HTTPException(status_code=400, detail="Invalid developer code")
    
    # Update user subscription
    current_user.subscription = {
        "status": "active",
        "plan": "pro",
        "expiresAt": None  # Developer access doesn't expire
    }
    db.commit()
    
    return {"message": "Developer access activated successfully"}

@router.get("/download-tracker")
async def get_download_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's download count
    downloads = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.downloaded == True
    ).count()
    
    # Get limit based on subscription
    limit = 10 if current_user.subscription["plan"] == "free" else float("inf")
    
    return {
        "downloads": downloads,
        "limit": limit,
        "remaining": limit - downloads if limit != float("inf") else "unlimited"
    } 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path
import shutil
import uuid
import base64

from ..database import get_db
from ..models.user import User, SubscriptionType
from ..models.resume import Resume, ResumeVersion
from ..models.analytics import Analytics, ActionType
from ..schemas.resume import (
    ResumeCreate,
    ResumeResponse,
    ResumeEnhanceRequest,
    ResumeScoreResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    LearningPathResponse
)
from ..services.gemini_service import (
    analyze_resume_with_gemini,
    enhance_resume_with_gemini,
    generate_cover_letter_with_gemini,
    extract_linkedin_profile_with_gemini,
    generate_learning_path_with_gemini
)
from .auth import get_current_user
from ..middleware.subscription import check_subscription_access, decrement_enhancements

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"file: {file}")
    print(f"job_description: {job_description}")
    print(f"linkedin_url: {linkedin_url}")
    print(f"current_user: {current_user}")
    print(f"db: {db}")  
    try:
        # Check subscription limits
        if current_user.subscription_type == SubscriptionType.FREE:
            raise HTTPException(
                status_code=403,
                detail="Free users cannot upload resumes. Please upgrade your subscription."
            )
        elif current_user.subscription_type == SubscriptionType.ONE_TIME:
            if current_user.remaining_enhancements <= 0:
                raise HTTPException(
                    status_code=403,
                    detail="No remaining enhancements. Please purchase more or upgrade to Pro."
                )

        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)

        # Save file with unique name
        file_extension = Path(file.filename).suffix
        unique_filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read file content as binary and encode as base64
        with open(file_path, "rb") as f:
            content = base64.b64encode(f.read()).decode('utf-8')

        # Create resume record
        resume = Resume(
            user_id=current_user.id,
            original_content=content,
            job_description=job_description,
            linkedin_url=linkedin_url
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        # Create initial version
        version = ResumeVersion(
            resume_id=resume.id,
            content=content,
            version_number=1
        )
        db.add(version)

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.RESUME_UPLOAD,
            metadata={
                "has_job_description": bool(job_description),
                "has_linkedin": bool(linkedin_url),
                "file_type": file_extension
            }
        )
        db.add(analytics)
        db.commit()

        # If LinkedIn URL provided, extract profile in background
        if linkedin_url:
            background_tasks.add_task(
                extract_linkedin_profile_with_gemini,
                linkedin_url,
                resume.id,
                db
            )

        # Clean up uploaded file
        os.remove(file_path)

        return resume

    except Exception as e:
        # Clean up uploaded file in case of error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze/{resume_id}")
async def analyze_resume(
    resume_id: int,
    job_description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        # Analyze resume
        analysis = await analyze_resume_with_gemini(
            resume.original_content,
            job_description or resume.job_description
        )

        # Update resume with analysis results
        resume.score = analysis.score
        resume.feedback = analysis.feedback
        resume.extracted_info = analysis.extracted_info
        resume.job_matches = analysis.job_matches
        resume.improvements = analysis.improvements
        db.commit()

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.RESUME_ANALYSIS,
            metadata={
                "has_job_description": bool(job_description),
                "score": analysis.score
            }
        )
        db.add(analytics)
        db.commit()

        return analysis

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/enhance/{resume_id}")
async def enhance_resume(
    resume_id: int,
    job_description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        # Enhance resume
        enhanced_content = await enhance_resume_with_gemini(
            resume.original_content,
            job_description or resume.job_description,
            resume.feedback
        )

        # Create new version
        version_number = db.query(ResumeVersion).filter(
            ResumeVersion.resume_id == resume.id
        ).count() + 1

        version = ResumeVersion(
            resume_id=resume.id,
            content=enhanced_content,
            version_number=version_number
        )
        db.add(version)

        # Update resume
        resume.enhanced_content = enhanced_content
        db.commit()

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.RESUME_ENHANCE,
            metadata={
                "version": version_number,
                "has_job_description": bool(job_description)
            }
        )
        db.add(analytics)
        db.commit()

        return {
            "enhanced_content": enhanced_content,
            "version": version_number
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cover-letter/{resume_id}")
async def generate_cover_letter(
    resume_id: int,
    job_description: str,
    company_info: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        # Generate cover letter
        cover_letter = await generate_cover_letter_with_gemini(
            resume.enhanced_content or resume.original_content,
            job_description,
            company_info
        )

        # Update resume
        resume.cover_letter = cover_letter
        db.commit()

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.COVER_LETTER_GENERATION,
            metadata={
                "has_company_info": bool(company_info)
            }
        )
        db.add(analytics)
        db.commit()

        return {"cover_letter": cover_letter}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/learning-path/{resume_id}")
async def generate_learning_path(
    resume_id: int,
    job_description: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        # Generate learning path
        learning_path = await generate_learning_path_with_gemini(
            resume.enhanced_content or resume.original_content,
            job_description,
            resume.feedback
        )

        # Update resume
        resume.learning_path = learning_path
        db.commit()

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.LEARNING_PATH_GENERATION
        )
        db.add(analytics)
        db.commit()

        return learning_path

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"} 
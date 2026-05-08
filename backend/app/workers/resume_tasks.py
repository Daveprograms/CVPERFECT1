"""
Resume Processing Tasks
Background tasks for resume analysis, enhancement, and AI features
Uses existing Gemini integration (not Pro tier)
"""

import logging
import asyncio
from typing import Dict, Any
from celery import Task
from sqlalchemy.orm import Session

from .celery_app import celery_app
from ..database import SessionLocal
from ..models.resume import Resume, ResumeAnalysis
from ..services.gemini_service import get_gemini_service

logger = logging.getLogger(__name__)

class DatabaseTask(Task):
    """Base task class that provides database session"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run(db, *args, **kwargs)
    
    def run(self, db: Session, *args, **kwargs):
        raise NotImplementedError


@celery_app.task(bind=True, base=DatabaseTask)
def analyze_resume_async(self, db: Session, resume_id: str, job_description: str = None) -> Dict[str, Any]:
    """
    Asynchronously analyze a resume using existing Gemini integration
    """
    try:
        logger.info(f"Starting async resume analysis for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume {resume_id} not found")
        
        gemini = get_gemini_service()
        analysis_result = asyncio.run(
            gemini.analyze_resume_content(resume.content, job_description)
        )
        
        # Save analysis to database
        overall = analysis_result.get("overall_score")
        if overall is None:
            overall = analysis_result.get("score")
        ats = analysis_result.get("ats_score")
        if overall is None or ats is None:
            raise ValueError("Async analysis: missing score or ats_score in Gemini result")
        analysis = ResumeAnalysis(
            resume_id=resume_id,
            analysis_data=analysis_result,
            overall_score=float(overall),
            ats_score=float(ats),
            strengths=analysis_result.get('strengths', []),
            recommendations=analysis_result.get('recommendations', [])
        )
        
        db.add(analysis)
        db.commit()
        
        logger.info(f"Completed async resume analysis for resume {resume_id}")
        return {
            "status": "completed",
            "resume_id": resume_id,
            "analysis_id": analysis.id,
            "overall_score": analysis.overall_score
        }
        
    except Exception as e:
        logger.error("Resume analysis failed for %s: %s", resume_id, e)
        # Do not retry Gemini calls — avoids 429 / quota amplification.
        raise


@celery_app.task(bind=True, base=DatabaseTask)
def generate_cover_letter_async(self, db: Session, resume_id: str, job_description: str, job_title: str = None, company_name: str = None) -> Dict[str, Any]:
    """
    Asynchronously generate a cover letter using existing Gemini integration
    """
    try:
        logger.info(f"Starting async cover letter generation for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume {resume_id} not found")
        
        resume_text = (resume.content or "").strip()
        if len(resume_text) < 40:
            raise ValueError(
                "Resume has too little text for cover letter generation. "
                "Re-upload or add content in the editor."
            )

        gemini = get_gemini_service()
        cover_letter_content = asyncio.run(
            gemini.generate_cover_letter(
                resume_content=resume_text,
                job_description=job_description,
            )
        )
        
        logger.info(f"Completed async cover letter generation for resume {resume_id}")
        return {
            "status": "completed",
            "resume_id": resume_id,
            "content": cover_letter_content,
            "job_title": job_title,
            "company_name": company_name
        }
        
    except Exception as e:
        logger.error("Cover letter generation failed for %s: %s", resume_id, e)
        raise


@celery_app.task(bind=True, base=DatabaseTask)
def generate_learning_path_async(self, db: Session, resume_id: str, job_description: str = None) -> Dict[str, Any]:
    """
    Asynchronously generate a learning path using existing Gemini integration
    """
    try:
        logger.info(f"Starting async learning path generation for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume {resume_id} not found")
        
        gemini = get_gemini_service()
        learning_path = asyncio.run(
            gemini.generate_learning_path(
                resume_content=resume.content,
                job_description=job_description
            )
        )
        
        logger.info(f"Completed async learning path generation for resume {resume_id}")
        return {
            "status": "completed",
            "resume_id": resume_id,
            "learning_path": learning_path
        }
        
    except Exception as e:
        logger.error("Learning path generation failed for %s: %s", resume_id, e)
        raise


@celery_app.task(bind=True, base=DatabaseTask)
def generate_practice_exam_async(self, db: Session, resume_id: str, job_description: str = None, num_questions: int = 10) -> Dict[str, Any]:
    """
    Asynchronously generate practice exam questions using existing Gemini integration
    """
    try:
        logger.info(f"Starting async practice exam generation for resume {resume_id}")
        
        # Get resume from database
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise ValueError(f"Resume {resume_id} not found")
        
        gemini = get_gemini_service()
        practice_exam = asyncio.run(
            gemini.generate_practice_exam(
                resume_content=resume.content,
                job_description=job_description,
                num_questions=num_questions
            )
        )
        
        logger.info(f"Completed async practice exam generation for resume {resume_id}")
        return {
            "status": "completed",
            "resume_id": resume_id,
            "exam": practice_exam,
            "num_questions": len(practice_exam.get('questions', []))
        }
        
    except Exception as e:
        logger.error("Practice exam generation failed for %s: %s", resume_id, e)
        raise


@celery_app.task(bind=True)
def process_resume_upload(self, resume_id: str, file_path: str) -> Dict[str, Any]:
    """
    Process uploaded resume file (extract text, validate, etc.)
    """
    try:
        logger.info(f"Processing uploaded resume {resume_id}")
        
        with SessionLocal() as db:
            resume = db.query(Resume).filter(Resume.id == resume_id).first()
            if not resume:
                raise ValueError(f"Resume {resume_id} not found")
            
            # Extract text from file (using existing text extraction)
            from ..utils.file_processing import extract_text_from_file
            
            extracted_text = extract_text_from_file(file_path)
            
            # Update resume with extracted content
            resume.content = extracted_text
            resume.processing_status = "completed"
            db.commit()
            
            logger.info(f"Completed processing for resume {resume_id}")
            return {
                "status": "completed",
                "resume_id": resume_id,
                "text_length": len(extracted_text)
            }
            
    except Exception as e:
        logger.error(f"Resume processing failed for {resume_id}: {str(e)}")
        self.retry(countdown=30, max_retries=3)


@celery_app.task
def cleanup_temp_files(file_paths: list) -> Dict[str, Any]:
    """
    Clean up temporary files after processing
    """
    import os
    
    cleaned_files = []
    errors = []
    
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                cleaned_files.append(file_path)
        except Exception as e:
            errors.append(f"Failed to remove {file_path}: {str(e)}")
    
    return {
        "cleaned_files": cleaned_files,
        "errors": errors
    } 
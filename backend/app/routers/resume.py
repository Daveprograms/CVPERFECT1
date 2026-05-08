from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import os
from pathlib import Path
import shutil
import uuid
import base64
from fastapi.responses import Response
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import io
import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Float, desc
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import get_db
from ..models.user import User, SubscriptionType
from ..models.resume import (
    Resume,
    ResumeVersion,
    ResumeAnalysis,
    ResumeAnalysisRequest,
    CoverLetterHistory,
    GeneratedResume,
    GeneratedResumeTemplate,
)
from ..models.analytics import Analytics, ActionType
from ..schemas.resume import (
    ResumeCreate,
    ResumeResponse,
    ResumeEnhanceRequest,
    ResumeScoreResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    CoverLetterUpdateRequest,
    LearningPathResponse,
    GeneratedResumeTemplateResponse,
    GeneratedResumeCreateRequest,
    GeneratedResumeUpdateRequest,
    GeneratedResumeSummaryRequest,
    GeneratedResumeAIGenerateRequest,
)
from ..services.gemini_service import (
    gemini_service,
    GeminiService
)
from .auth import get_current_user
from ..middleware.subscription import check_subscription_access, decrement_enhancements
from ..services.real_data_service import get_data_service, DataSourceValidator
from ..utils.file_processing import save_uploaded_file, extract_text_from_file, cleanup_temp_file, get_file_info, validate_file_type, validate_file_size
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter()


def _default_generated_resume_templates() -> List[Dict[str, Any]]:
    return [
        {
            "key": "classic",
            "label": "Classic",
            "description": "Serif · Traditional · ATS-safe",
            "sort_order": 1,
            "preview_meta": {"theme": "classic", "ats_safe": True},
        },
        {
            "key": "sidebar",
            "label": "Sidebar",
            "description": "Two-column · Navy sidebar · Tech",
            "sort_order": 2,
            "preview_meta": {"theme": "sidebar", "ats_safe": False},
        },
        {
            "key": "modern",
            "label": "Modern",
            "description": "Dark header · Orange accent · Bold",
            "sort_order": 3,
            "preview_meta": {"theme": "modern", "ats_safe": True},
        },
        {
            "key": "executive",
            "label": "Executive",
            "description": "Navy & gold · Prestige · Senior",
            "sort_order": 4,
            "preview_meta": {"theme": "executive", "ats_safe": True},
        },
        {
            "key": "minimal",
            "label": "Minimal",
            "description": "Ultra-clean · Light weight · Creative",
            "sort_order": 5,
            "preview_meta": {"theme": "minimal", "ats_safe": True},
        },
    ]


def _ensure_generated_templates(db: Session) -> None:
    existing_keys = {
        row[0]
        for row in db.query(GeneratedResumeTemplate.key).all()
    }

    for template in _default_generated_resume_templates():
        if template["key"] in existing_keys:
            continue
        db.add(
            GeneratedResumeTemplate(
                key=template["key"],
                label=template["label"],
                description=template["description"],
                sort_order=template["sort_order"],
                preview_meta=template["preview_meta"],
                is_active=True,
            )
        )
    db.commit()


def _normalize_resume_data(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    default_payload = {
        "personal_info": {},
        "summary_inputs": {},
        "summary": "",
        "experience": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "languages": [],
    }
    if not isinstance(resume_data, dict):
        return default_payload
    normalized = {**default_payload, **resume_data}
    if not isinstance(normalized.get("experience"), list):
        normalized["experience"] = []
    if not isinstance(normalized.get("education"), list):
        normalized["education"] = []
    if not isinstance(normalized.get("skills"), list):
        normalized["skills"] = []
    if not isinstance(normalized.get("certifications"), list):
        normalized["certifications"] = []
    if not isinstance(normalized.get("languages"), list):
        normalized["languages"] = []
    return normalized


def _build_generated_resume_response(item: GeneratedResume) -> Dict[str, Any]:
    template_key = item.template.key if item.template else None
    return {
        "id": str(item.id),
        "user_id": str(item.user_id),
        "template_key": template_key,
        "title": item.title,
        "status": item.status,
        "resume_data": _normalize_resume_data(item.resume_data or {}),
        "quick_import_input": item.quick_import_input,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def _is_paid_subscription(subscription: SubscriptionType) -> bool:
    return subscription in {
        SubscriptionType.PROFESSIONAL,
        SubscriptionType.ENTERPRISE,
    }


def _build_rule_based_summary(payload: GeneratedResumeSummaryRequest) -> str:
    role = payload.current_role or "professional"
    years = payload.years_experience or "several"
    specialization = payload.specialization or "cross-functional delivery"
    highlights = [h.strip() for h in payload.highlights if h and h.strip()]
    highlight_text = " ".join(highlights[:2]) if highlights else "Proven track record of shipping measurable outcomes."
    target_role = payload.target_role or "the next role"
    target_company_type = payload.target_company_type or "growth-oriented teams"

    return (
        f"{role} with {years} years of experience in {specialization}. "
        f"{highlight_text} "
        f"Currently targeting {target_role} opportunities at {target_company_type}."
    )


def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    if not text:
        return {}

    try:
        return json.loads(text)
    except Exception:
        pass

    fence_start = text.find("```")
    if fence_start != -1:
        fence_end = text.rfind("```")
        if fence_end > fence_start:
            fenced = text[fence_start + 3:fence_end].strip()
            if fenced.startswith("json"):
                fenced = fenced[4:].strip()
            try:
                return json.loads(fenced)
            except Exception:
                pass

    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last != -1 and last > first:
        possible = text[first:last + 1]
        try:
            return json.loads(possible)
        except Exception:
            return {}

    return {}


@router.get("/generated/templates")
async def list_generated_resume_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_generated_templates(db)
    templates = db.query(GeneratedResumeTemplate).filter(
        GeneratedResumeTemplate.is_active == True
    ).order_by(GeneratedResumeTemplate.sort_order.asc()).all()

    return [
        {
            "id": str(t.id),
            "key": t.key,
            "label": t.label,
            "description": t.description,
            "preview_meta": t.preview_meta or {},
            "sort_order": t.sort_order,
        }
        for t in templates
    ]


@router.get("/generated")
async def list_generated_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_generated_templates(db)
    items = db.query(GeneratedResume).filter(
        GeneratedResume.user_id == current_user.id
    ).order_by(GeneratedResume.created_at.desc()).all()
    return [_build_generated_resume_response(item) for item in items]


@router.post("/generated")
async def create_generated_resume(
    request: GeneratedResumeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_generated_templates(db)
    template = None
    if request.template_key:
        template = db.query(GeneratedResumeTemplate).filter(
            GeneratedResumeTemplate.key == request.template_key,
            GeneratedResumeTemplate.is_active == True,
        ).first()
        if not template:
            raise HTTPException(status_code=400, detail="Invalid template key")

    item = GeneratedResume(
        user_id=current_user.id,
        template_id=template.id if template else None,
        title=(request.title or "Untitled Generated Resume").strip() or "Untitled Generated Resume",
        status="draft",
        resume_data=_normalize_resume_data(request.resume_data),
        quick_import_input=request.quick_import_input,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_generated_resume_response(item)


@router.get("/generated/{generated_resume_id}")
async def get_generated_resume(
    generated_resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(GeneratedResume).filter(
        GeneratedResume.id == generated_resume_id,
        GeneratedResume.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generated resume not found")
    return _build_generated_resume_response(item)


@router.put("/generated/{generated_resume_id}")
async def update_generated_resume(
    generated_resume_id: str,
    request: GeneratedResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(GeneratedResume).filter(
        GeneratedResume.id == generated_resume_id,
        GeneratedResume.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generated resume not found")

    if request.template_key is not None:
        template = db.query(GeneratedResumeTemplate).filter(
            GeneratedResumeTemplate.key == request.template_key,
            GeneratedResumeTemplate.is_active == True,
        ).first()
        if not template:
            raise HTTPException(status_code=400, detail="Invalid template key")
        item.template_id = template.id

    if request.title is not None:
        title = request.title.strip()
        item.title = title or item.title

    if request.resume_data is not None:
        item.resume_data = _normalize_resume_data(request.resume_data)

    if request.quick_import_input is not None:
        item.quick_import_input = request.quick_import_input

    if request.status is not None:
        item.status = request.status

    db.commit()
    db.refresh(item)
    return _build_generated_resume_response(item)


@router.delete("/generated/{generated_resume_id}")
async def delete_generated_resume(
    generated_resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(GeneratedResume).filter(
        GeneratedResume.id == generated_resume_id,
        GeneratedResume.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generated resume not found")

    db.delete(item)
    db.commit()
    return {"success": True}


@router.post("/generated/{generated_resume_id}/summary")
async def generate_generated_resume_summary(
    generated_resume_id: str,
    request: GeneratedResumeSummaryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(GeneratedResume).filter(
        GeneratedResume.id == generated_resume_id,
        GeneratedResume.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generated resume not found")

    if _is_paid_subscription(current_user.subscription_type):
        prompt = (
            "Write a concise professional resume summary (2-4 sentences).\n"
            f"Current role: {request.current_role or ''}\n"
            f"Years of experience: {request.years_experience or ''}\n"
            f"Specialization: {request.specialization or ''}\n"
            f"Highlights: {'; '.join(request.highlights)}\n"
            f"Target role: {request.target_role or ''}\n"
            f"Target company type: {request.target_company_type or ''}\n"
            "Return plain text only."
        )
        try:
            from ..services.gemini_service import GeminiService

            gemini_svc = GeminiService()
            response = gemini_svc.client.models.generate_content(model=gemini_svc.model, contents=prompt)
            summary = (response.text or "").strip()
            if not summary:
                summary = _build_rule_based_summary(request)
            generation_mode = "ai"
        except Exception:
            summary = _build_rule_based_summary(request)
            generation_mode = "rule_based_fallback"
    else:
        summary = _build_rule_based_summary(request)
        generation_mode = "rule_based"

    data = _normalize_resume_data(item.resume_data or {})
    data["summary_inputs"] = request.dict()
    data["summary"] = summary
    item.resume_data = data
    db.commit()
    db.refresh(item)

    return {
        "summary": summary,
        "generation_mode": generation_mode,
        "generated_resume": _build_generated_resume_response(item),
    }


@router.post("/generated/{generated_resume_id}/ai-generate")
async def ai_generate_generated_resume(
    generated_resume_id: str,
    request: GeneratedResumeAIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(GeneratedResume).filter(
        GeneratedResume.id == generated_resume_id,
        GeneratedResume.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Generated resume not found")

    if not _is_paid_subscription(current_user.subscription_type):
        raise HTTPException(status_code=403, detail="AI resume generation is available on Pro and Enterprise plans")

    seed = _normalize_resume_data(item.resume_data or {})
    import_text = request.quick_import_input or item.quick_import_input or ""
    target_role = request.target_role or seed.get("summary_inputs", {}).get("target_role", "")
    target_company_type = request.target_company_type or seed.get("summary_inputs", {}).get("target_company_type", "")

    prompt = (
        "You are a resume writing assistant. Return valid JSON only. No markdown.\n"
        "Use this exact schema with all keys present:\n"
        "{\n"
        "  \"personal_info\": {\"full_name\":\"\",\"target_title\":\"\",\"email\":\"\",\"phone\":\"\",\"location\":\"\",\"linkedin_url\":\"\",\"website\":\"\"},\n"
        "  \"summary_inputs\": {\"current_role\":\"\",\"years_experience\":\"\",\"specialization\":\"\",\"highlights\":[],\"target_role\":\"\",\"target_company_type\":\"\"},\n"
        "  \"summary\":\"\",\n"
        "  \"experience\":[{\"job_title\":\"\",\"company\":\"\",\"dates\":\"\",\"responsibilities\":\"\",\"achievements\":\"\",\"led_team\":\"\"}],\n"
        "  \"education\":[{\"degree\":\"\",\"institution\":\"\",\"graduation_year\":\"\",\"details\":\"\"}],\n"
        "  \"skills\":[],\n"
        "  \"certifications\":[{\"name\":\"\",\"year\":\"\"}],\n"
        "  \"languages\":[{\"name\":\"\",\"level\":\"Fluent\"}]\n"
        "}\n"
        "Improve bullet specificity and include measurable impact where possible.\n"
        f"Target role: {target_role}\n"
        f"Target company type: {target_company_type}\n"
        f"Job description: {request.job_description or ''}\n"
        f"Current JSON seed: {json.dumps(seed)}\n"
        f"Imported resume text and notes: {import_text}\n"
    )

    try:
        from ..services.gemini_service import GeminiService

        gemini_svc = GeminiService()
        response = gemini_svc.client.models.generate_content(model=gemini_svc.model, contents=prompt)
        payload = _extract_json_object(response.text or "")
        generated_data = _normalize_resume_data(payload)
    except Exception as e:
        logger.error(f"AI generated resume failed: {str(e)}")
        raise HTTPException(status_code=500, detail="AI resume generation failed")

    item.resume_data = generated_data
    item.quick_import_input = import_text or item.quick_import_input
    item.status = "draft"
    db.commit()
    db.refresh(item)

    return {
        "generation_mode": "ai",
        "generated_resume": _build_generated_resume_response(item),
    }

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process real resume file with actual text extraction
    """
    try:
        # Get real data service
        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "resume_upload")
        
        # Validate file type and size
        if not validate_file_type(file.filename):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload PDF, DOC, DOCX, or TXT files."
            )
        
        if not validate_file_size(len(await file.read()), max_size_mb=10):
            raise HTTPException(
                status_code=400, 
                detail="File size too large. Maximum size is 10MB."
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Save uploaded file to disk for real processing
        file_path = save_uploaded_file(file)
        
        try:
            # Process uploaded file with real text extraction
            result = await data_service.process_uploaded_resume(
                file_path=file_path,
                user_id=current_user.id,
                filename=file.filename
            )
            
            logger.info(f"Real resume upload processed: {result['character_count']} characters extracted")
            
            return {
                "message": "Resume uploaded and processed successfully",
                "resume_id": result["resume_id"],
                "character_count": result["character_count"],
                "processing_status": result["processing_status"]
            }
            
        finally:
            # Clean up temporary file
            cleanup_temp_file(file_path)
            
    except Exception as e:
        logger.error(f"Resume upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{resume_id}")
async def analyze_resume(
    resume_id: str,
    request: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze resume using existing Gemini integration with real data
    """
    try:
        # Verify resume belongs to user
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get real data service
        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "resume_analysis")
        
        # Check if we have real resume content
        if not resume.content or len(resume.content.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Resume content is too short or missing. Please upload a valid resume."
            )
        
        # Get job description if provided
        job_description = None
        if request and hasattr(request, 'job_description'):
            job_description = request.job_description
        
        # Use Gemini service for analysis (instantiate fresh to pick up current env key)
        from ..services.gemini_service import GeminiService
        gemini_svc = GeminiService()
        
        try:
            # Analyze real resume content
            analysis_result = await gemini_svc.analyze_resume_content(
                resume.content, 
                job_description
            )
            
            # Save real analysis to database
            analysis = ResumeAnalysis(
                resume_id=resume.id,
                analysis_data=analysis_result,
                overall_score=analysis_result.get('overall_score', 0),
                ats_score=analysis_result.get('ats_score', 0),
                strengths=analysis_result.get('strengths', []),
                recommendations=analysis_result.get('recommendations', [])
            )
            
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            
            logger.info(f"Real resume analysis completed for {resume_id}: score {analysis.overall_score}")
            
            return {
                "analysis_id": analysis.id,
                "overall_score": analysis.overall_score,
                "ats_score": analysis.ats_score,
                "strengths": analysis.strengths,
                "feedback": analysis_result.get('feedback', []),
                "recommendations": analysis.recommendations,
                "data_source": "real_gemini_analysis"
            }
            
        except Exception as ai_error:
            import traceback
            logger.error(f"AI analysis failed: {str(ai_error)}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(ai_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@router.post("/fix")
async def fix_resume(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume_id = request.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    content = resume.content
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Resume content is empty")

    try:
        from ..services.gemini_service import GeminiService
        gemini_svc = GeminiService()
        result = await gemini_svc.fix_resume(
            content=content,
            job_description=request.get("job_description"),
            feedback=request.get("feedback"),
            extracted_info=request.get("extracted_info")
        )
        return result
    except Exception as e:
        logger.error(f"Resume fix failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fix resume")

@router.post("/enhance/{resume_id}")
async def enhance_resume(
    resume_id: str,
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
        enhanced_content = await gemini_service.enhance_resume_with_gemini(
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

@router.get("/cover-letter/history")
async def list_cover_letter_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(CoverLetterHistory, Resume.filename).join(
        Resume, Resume.id == CoverLetterHistory.resume_id
    ).filter(
        CoverLetterHistory.user_id == current_user.id
    ).order_by(desc(CoverLetterHistory.created_at)).all()

    return [
        {
            "id": str(entry.id),
            "resume_id": str(entry.resume_id),
            "filename": filename,
            "job_title": entry.job_title,
            "company_name": entry.company_name,
            "content": entry.content,
            "created_at": entry.created_at,
        }
        for entry, filename in entries
    ]

@router.put("/cover-letter/history/{cover_letter_id}")
async def update_cover_letter_history_item(
    cover_letter_id: str,
    request: CoverLetterUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(CoverLetterHistory).filter(
        CoverLetterHistory.id == cover_letter_id,
        CoverLetterHistory.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    entry.content = request.content
    db.commit()
    db.refresh(entry)

    filename = db.query(Resume.filename).filter(Resume.id == entry.resume_id).scalar()
    return {
        "id": str(entry.id),
        "resume_id": str(entry.resume_id),
        "filename": filename,
        "job_title": entry.job_title,
        "company_name": entry.company_name,
        "content": entry.content,
        "created_at": entry.created_at,
    }

@router.delete("/cover-letter/history/{cover_letter_id}")
async def delete_cover_letter_history_item(
    cover_letter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(CoverLetterHistory).filter(
        CoverLetterHistory.id == cover_letter_id,
        CoverLetterHistory.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    db.delete(entry)
    db.commit()
    return {"success": True}

@router.get("/cover-letter/{resume_id}")
async def get_cover_letter(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    entry = db.query(CoverLetterHistory).filter(
        CoverLetterHistory.resume_id == resume.id,
        CoverLetterHistory.user_id == current_user.id
    ).order_by(desc(CoverLetterHistory.created_at)).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    return {
        "id": str(entry.id),
        "resume_id": str(resume.id),
        "filename": resume.filename,
        "job_title": entry.job_title,
        "company_name": entry.company_name,
        "cover_letter": entry.content,
        "created_at": entry.created_at,
    }

@router.post("/cover-letter/{resume_id}")
async def generate_cover_letter(
    resume_id: str,
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"📝 Cover letter generation started for resume {resume_id} by user {current_user.id}")
    
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        print(f"❌ Resume {resume_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Resume not found")

    print(f"✅ Resume found: {resume.filename}")

    try:
        print("🤖 Calling Gemini API to generate cover letter...")
        # Generate cover letter using the text content
        resume_text_content = resume.content
        print(f"📄 Using resume content: {len(resume_text_content) if resume_text_content else 0} characters")
        
        if not resume_text_content:
            raise HTTPException(status_code=400, detail="Resume content not available for cover letter generation")

        company_info = request.company_info or {}
        job_title = request.job_title or company_info.get("job_title") or company_info.get("role")
        company_name = request.company_name or company_info.get("company_name") or company_info.get("company")
        
        cover_letter = await gemini_service.generate_cover_letter(
            resume_text_content,
            request.job_description,
            job_title,
            company_name
        )
        
        print(f"✅ Cover letter generated successfully (length: {len(cover_letter)} chars)")

        cover_letter_entry = CoverLetterHistory(
            user_id=current_user.id,
            resume_id=resume.id,
            job_title=job_title,
            company_name=company_name,
            job_description=request.job_description,
            content=cover_letter,
        )
        db.add(cover_letter_entry)
        db.commit()
        db.refresh(cover_letter_entry)

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.COVER_LETTER_GENERATION,
            metadata={
                "job_description_provided": bool(request.job_description)
            }
        )
        db.add(analytics)
        db.commit()

        return {
            "id": str(cover_letter_entry.id),
            "resume_id": str(resume.id),
            "filename": resume.filename,
            "job_title": job_title,
            "company_name": company_name,
            "cover_letter": cover_letter,
            "created_at": cover_letter_entry.created_at,
        }

    except Exception as e:
        print(f"❌ Cover letter generation failed: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Cover letter generation failed: {str(e)}")

@router.post("/learning-path/{resume_id}")
async def generate_learning_path(
    resume_id: str,
    request: CoverLetterRequest,
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
        # Generate learning path using the text content
        resume_text_content = resume.content or resume.enhanced_content or resume.original_content
        
        if not resume_text_content:
            raise HTTPException(status_code=400, detail="Resume content not available for learning path generation")
            
        learning_path = await gemini_service.generate_learning_path(
            resume_text_content,
            request.job_description,
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

@router.post("/practice-exam/{resume_id}")
async def generate_practice_exam(
    resume_id: str,
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a custom practice exam based on resume and job requirements"""
    print(f"🧪 Backend practice exam endpoint called for resume: {resume_id}")
    print(f"👤 User: {current_user.email} (ID: {current_user.id})")
    print(f"📝 Job description provided: {bool(request.job_description)}")
    print(f"📝 Job description length: {len(request.job_description) if request.job_description else 0}")
    
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        print(f"❌ Resume not found: {resume_id}")
        raise HTTPException(status_code=404, detail="Resume not found")

    print(f"✅ Resume found: {resume.filename}")
    print(f"📄 Resume content length: {len(resume.content) if resume.content else 0}")

    try:
        # Get learning path for context (if available)
        learning_plan = resume.learning_path or {}
        print(f"🎓 Learning plan available: {bool(learning_plan)}")
        
        # Generate practice exam
        print("🤖 Calling Gemini API for practice exam generation...")
        practice_exam = await gemini_service.generate_practice_exam(
            resume.content,
            request.job_description,
            request.num_questions
        )
        print(f"✅ Practice exam generated successfully")
        print(f"📊 Exam info: {practice_exam.get('exam_info', {}).get('title', 'Unknown')}")
        print(f"❓ Total questions: {len(practice_exam.get('questions', []))}")

        # Save practice exam to database
        resume.practice_exam = practice_exam
        db.commit()
        print("💾 Practice exam saved to database")

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.PRACTICE_EXAM_GENERATION
        )
        db.add(analytics)
        db.commit()
        print("✅ Analytics tracked")

        return practice_exam

    except Exception as e:
        print(f"❌ Practice exam generation failed: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

@router.get("/history")
async def get_resume_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real user resume history from database
    """
    try:
        # Get real data service
        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "resume_history")
        
        # Get real user resumes from database
        resumes = data_service.get_user_resumes(current_user.id)
        
        logger.info(f"Retrieved {len(resumes)} real resumes for user {current_user.id}")
        return resumes
        
    except Exception as e:
        logger.error(f"Failed to get resume history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve resume history")

@router.get("/analytics")
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real user analytics from database
    """
    try:
        # Get real data service
        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "user_analytics")
        
        # Get real analytics from database
        analytics = data_service.get_user_analytics(current_user.id)
        
        logger.info(f"Retrieved real analytics for user {current_user.id}")
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get user analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics")

@router.get("/download/{resume_id}")
async def download_resume_report(
    resume_id: str,
    format: str = Query(default="pdf", regex="^(pdf|txt|json)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download resume analysis report in specified format"""
    
    # Get the resume from database
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if not resume.score:
        raise HTTPException(status_code=400, detail="Resume analysis not available")
    
    # Construct analysis data from resume fields
    analysis_data = {
        "score": resume.score,
        "feedback": resume.feedback or [],
        "extracted_info": resume.extracted_info or {},
        "job_matches": resume.job_matches or [],
        "improvements": resume.improvements or []
    }
    
    if format == "json":
        # Return JSON format
        return Response(
            content=json.dumps(analysis_data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=resume_analysis_{resume_id[:8]}.json"}
        )
    
    elif format == "txt":
        # Generate text report
        report = generate_text_report(analysis_data, resume)
        return Response(
            content=report,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=resume_analysis_{resume_id[:8]}.txt"}
        )
    
    elif format == "pdf":
        # Generate PDF report
        pdf_content = generate_pdf_report(analysis_data, resume)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=resume_analysis_{resume_id[:8]}.pdf"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

def generate_text_report(analysis_data: dict, resume) -> str:
    """Generate a text-based report"""
    report_lines = [
        "RESUME ANALYSIS REPORT",
        "=" * 50,
        "",
        f"Resume: {resume.filename}",
        f"Analyzed: {resume.updated_at.strftime('%Y-%m-%d %H:%M')}",
        f"Overall Score: {analysis_data.get('score', 0)}/100",
        "",
        "PERSONAL INFORMATION:",
        "-" * 20
    ]
    
    if 'extracted_info' in analysis_data:
        info = analysis_data['extracted_info']
        report_lines.extend([
            f"Name: {info.get('name', 'N/A')}",
            f"Email: {info.get('contact', {}).get('email', 'N/A')}",
            f"Phone: {info.get('contact', {}).get('phone', 'N/A')}",
            f"Location: {info.get('contact', {}).get('location', 'N/A')}",
            "",
            "SUMMARY:",
            "-" * 8,
            info.get('summary', 'No summary available'),
            ""
        ])
    
    # Add feedback sections
    if 'feedback' in analysis_data:
        report_lines.extend([
            "DETAILED FEEDBACK BY CATEGORY:",
            "-" * 35,
            ""
        ])
        
        for category in analysis_data['feedback']:
            report_lines.extend([
                f"{category.get('category', 'Unknown').upper()}:",
                ""
            ])
            
            for item in category.get('items', []):
                report_lines.extend([
                    f"  Issue: {item.get('issue', 'N/A')}",
                    f"  Suggestion: {item.get('suggestion', 'N/A')}",
                    f"  Severity: {item.get('severity', 'N/A')}",
                    ""
                ])
    
    # Add experience section
    if 'extracted_info' in analysis_data and 'experience' in analysis_data['extracted_info']:
        report_lines.extend([
            "EXPERIENCE:",
            "-" * 11,
            ""
        ])
        
        for i, exp in enumerate(analysis_data['extracted_info']['experience'], 1):
            report_lines.extend([
                f"{i}. {exp.get('title', 'N/A')} at {exp.get('company', 'N/A')}",
                f"   Duration: {exp.get('duration', 'N/A')}",
                "   Achievements:"
            ])
            
            for achievement in exp.get('achievements', []):
                report_lines.append(f"   - {achievement}")
            
            report_lines.append("")
    
    report_lines.extend([
        "",
        f"Report generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    ])
    
    return "\n".join(report_lines)

def generate_pdf_report(analysis_data: dict, resume) -> bytes:
    """Generate a PDF report using ReportLab"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    story = []
    
    # Title
    story.append(Paragraph("Resume Analysis Report", title_style))
    story.append(Spacer(1, 12))
    
    # Basic info
    story.append(Paragraph("Report Summary", heading_style))
    basic_info = [
        ['Resume:', resume.filename or 'Unnamed Resume'],
        ['Analyzed:', resume.updated_at.strftime('%Y-%m-%d %H:%M')],
        ['Overall Score:', f"{analysis_data.get('score', 0)}/100"],
    ]
    
    basic_table = Table(basic_info, colWidths=[2*inch, 4*inch])
    basic_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(basic_table)
    story.append(Spacer(1, 20))
    
    # Personal Information
    if 'extracted_info' in analysis_data:
        info = analysis_data['extracted_info']
        story.append(Paragraph("Personal Information", heading_style))
        
        personal_info = [
            ['Name:', info.get('name', 'N/A')],
            ['Email:', info.get('contact', {}).get('email', 'N/A')],
            ['Phone:', info.get('contact', {}).get('phone', 'N/A')],
            ['Location:', info.get('contact', {}).get('location', 'N/A')],
        ]
        
        personal_table = Table(personal_info, colWidths=[2*inch, 4*inch])
        personal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(personal_table)
        story.append(Spacer(1, 20))
        
        # Summary
        if info.get('summary'):
            story.append(Paragraph("Professional Summary", heading_style))
            story.append(Paragraph(info['summary'], styles['Normal']))
            story.append(Spacer(1, 20))
    
    # Feedback sections
    if 'feedback' in analysis_data:
        story.append(Paragraph("Detailed Feedback", heading_style))
        
        for category in analysis_data['feedback']:
            cat_title = category.get('category', 'Unknown').title()
            story.append(Paragraph(cat_title, styles['Heading3']))
            
            for item in category.get('items', []):
                issue_text = f"<b>Issue:</b> {item.get('issue', 'N/A')}"
                suggestion_text = f"<b>Suggestion:</b> {item.get('suggestion', 'N/A')}"
                severity_text = f"<b>Severity:</b> {item.get('severity', 'N/A').title()}"
                
                story.append(Paragraph(issue_text, styles['Normal']))
                story.append(Paragraph(suggestion_text, styles['Normal']))
                story.append(Paragraph(severity_text, styles['Normal']))
                story.append(Spacer(1, 12))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_text = f"Report generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    story.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.read()

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
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
    resume_id: str,
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

@router.get("/feedback-history")
async def get_feedback_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated feedback history for the current user"""
    try:
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get total count
        total_count = db.query(FeedbackHistory).filter(
            FeedbackHistory.user_id == current_user.id
        ).count()
        
        # Get paginated results
        feedback_history = db.query(FeedbackHistory).filter(
            FeedbackHistory.user_id == current_user.id
        ).order_by(desc(FeedbackHistory.created_at)).offset(offset).limit(limit).all()
        
        # Get associated resume data
        results = []
        for feedback in feedback_history:
            resume = db.query(Resume).filter(Resume.id == feedback.resume_id).first()
            results.append({
                "id": str(feedback.id),
                "resume_id": str(feedback.resume_id),
                "resume_filename": resume.filename if resume else "Unknown",
                "feedback_text": feedback.feedback_text,
                "score": feedback.score,
                "ai_analysis_version": feedback.ai_analysis_version,
                "created_at": feedback.created_at.isoformat(),
                "resume_created_at": resume.created_at.isoformat() if resume else None
            })
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        return {
            "feedback_history": results,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_count,
                "items_per_page": limit,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
        
    except Exception as e:
        print(f"Error getting feedback history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get feedback history")

# Removed unused debug endpoint 
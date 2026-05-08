from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
import json
import os
from pathlib import Path
import shutil
import uuid
import base64
from fastapi.responses import Response
from datetime import datetime, timezone
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
from ..models.resume import Resume, ResumeVersion, ResumeAnalysis, ResumeAnalysisRequest
from ..models.analytics import Analytics, ActionType
from ..models.job_application import JobApplication
from ..schemas.resume import (
    ResumeCreate,
    ResumeResponse,
    ResumeContentUpdate,
    ResumeEnhanceRequest,
    ResumeScoreResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    LearningPathResponse
)
from ..services.gemini_service import get_gemini_service
from ..core.dependencies import get_current_user
from ..middleware.subscription import check_subscription_access, decrement_enhancements
from ..services.real_data_service import get_data_service, DataSourceValidator
from ..utils.file_processing import (
    save_uploaded_file,
    extract_text_from_file,
    cleanup_temp_file,
    get_file_info,
    validate_file_size,
)
from ..services.storage_service import upload_local_file
from ..utils.resume_analysis_format import build_analysis_api_dict, ensure_json_serializable
from logging import getLogger
import time
import asyncio
from ..core.config import settings

logger = getLogger(__name__)

router = APIRouter()

_ANALYZE_RESUME_COOLDOWN_SECONDS = 10
_last_analyze_by_resume: Dict[str, float] = {}
_last_analyze_lock = asyncio.Lock()

def _analyze_in_flight_stale_seconds() -> float:
    """
    If a worker crashes after setting `processing_status=analyzing`, clients need a way to recover.

    In dev, keep this short so you're never wedged behind a stale row.
    In prod, keep it comfortably above worst-case analysis latency.
    """

    if getattr(settings, "DEBUG", False):
        return 90.0
    return 45.0 * 60.0


def _resume_activity_ts(resume: Resume) -> datetime:
    """
    Timestamp used to decide whether processing_status='analyzing' is stale.

    Prefer processing_status_at (set whenever analysis lifecycle updates the status).
    Do not use upload_date for in-flight detection — uploads can be recent while analysis
    has already crashed, which would wedge 409s for up to the stale window.
    """
    ts = getattr(resume, "processing_status_at", None)
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts.astimezone(timezone.utc)
    # Legacy rows: treat as stale immediately (allow retry).
    return datetime.fromtimestamp(0, tz=timezone.utc)


def _touch_processing_status(resume: Resume, status: str) -> None:
    resume.processing_status = status
    resume.processing_status_at = datetime.now(timezone.utc)


def _release_stuck_analyzing(db: Session, resume_id: uuid.UUID) -> None:
    """If analysis exited early with HTTP errors, status can stay 'analyzing' → endless 409."""
    try:
        row = db.query(Resume).filter(Resume.id == resume_id).first()
        if not row:
            return
        if (row.processing_status or "").strip().lower() != "analyzing":
            return
        _touch_processing_status(row, "failed")
        db.commit()
    except Exception:
        db.rollback()


def _resume_uuid_param(resume_id: str) -> uuid.UUID:
    """Normalize path resume id so ORM matches PostgreSQL uuid consistently."""
    try:
        return uuid.UUID(str(resume_id).strip())
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid resume id format.",
        ) from None


_COVER_LETTER_MIN_RESUME_CHARS = 40


def _get_user_latest_resume(db: Session, user_id: uuid.UUID) -> Optional[Resume]:
    """Most recently uploaded resume for the user (same ordering as history list)."""
    return (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(desc(Resume.upload_date))
        .first()
    )


def _resolve_resume_for_cover_letter(
    resume_id: str,
    current_user: User,
    db: Session,
) -> Resume:
    """
    Accept a concrete resume UUID or the reserved path segment ``latest``
    (most recent resume for this user).
    """
    key = (resume_id or "").strip().lower()
    if key == "latest":
        resume = _get_user_latest_resume(db, current_user.id)
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="No resume found. Upload a resume before generating a cover letter.",
            )
        return resume

    rid = _resume_uuid_param(resume_id)
    resume = (
        db.query(Resume)
        .filter(Resume.id == rid, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


class AnalyzeResumeBody(BaseModel):
    """`model` or other extra fields from clients are ignored; Gemini model is server-forced."""

    model_config = ConfigDict(extra="ignore")

    job_description: Optional[str] = None


class FixResumeBody(BaseModel):
    """Legacy / BFF shape for “fix resume” → same pipeline as POST /enhance/{id}."""

    model_config = ConfigDict(extra="ignore")

    resume_id: str
    job_description: Optional[str] = None


allowed_types = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]


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
        
        # Validate file type (PDF / DOCX only) and size
        raw_ct = (file.content_type or "").strip()
        mime = raw_ct.split(";", 1)[0].strip().lower()
        if mime not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type",
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
        upload_local_file(
            f"{current_user.id}/{Path(file_path).name}",
            file_path,
            getattr(file, "content_type", None),
        )

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
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{resume_id}")
async def analyze_resume(
    resume_id: str,
    body: AnalyzeResumeBody = Body(default_factory=AnalyzeResumeBody),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run Gemini analysis, persist a ResumeAnalysis row, return the same JSON shape as GET.
    """
    rid = _resume_uuid_param(resume_id)
    logger.info(
        "[POST analyze 01] start resume_id=%s user_id=%s",
        rid,
        current_user.id,
    )

    analysis_inflight = False
    try:
        logger.info("[POST analyze 02] db_fetch_resume resume_id=%s", rid)
        resume = db.query(Resume).filter(
            Resume.id == rid,
            Resume.user_id == current_user.id,
        ).first()

        if not resume:
            logger.warning(
                "[POST analyze] resume_not_found resume_id=%s user_id=%s",
                rid,
                current_user.id,
            )
            raise HTTPException(status_code=404, detail="Resume not found")

        logger.info(
            "[POST analyze 03] resume_loaded resume_id=%s filename=%r content_chars=%s",
            rid,
            resume.filename,
            len(resume.content.strip()) if resume.content else 0,
        )

        # If a previous attempt crashed mid-flight, `processing_status` may remain `analyzing`.
        # Block concurrent duplicates, but allow recovery after a stale timeout.
        status = (resume.processing_status or "").strip().lower()
        if status == "analyzing":
            age_s = (datetime.now(timezone.utc) - _resume_activity_ts(resume)).total_seconds()
            # If clocks skew (DB timestamp appears "in the future"), don't wedge users with endless 409s.
            if age_s < 0:
                logger.warning(
                    "[POST analyze 03b] clock_skew_detected resume_id=%s age_s=%.1f status=%r — allowing retry",
                    rid,
                    age_s,
                    resume.processing_status,
                )
                age_s = _analyze_in_flight_stale_seconds() + 1.0

            stale_s = _analyze_in_flight_stale_seconds()
            if age_s < stale_s:
                logger.warning(
                    "[POST analyze 03b] blocked_duplicate_inflight resume_id=%s age_s=%.1f status=%r",
                    rid,
                    age_s,
                    resume.processing_status,
                )
                raise HTTPException(
                    status_code=409,
                    detail="Analysis is already running for this resume. Please wait for it to finish.",
                )
            logger.warning(
                "[POST analyze 03b] stale_analyzing_state resume_id=%s age_s=%.1f stale_s=%.1f — releasing and retrying",
                rid,
                age_s,
                stale_s,
            )
            # Release stale lock immediately so this same request can proceed.
            try:
                _touch_processing_status(resume, "failed")
                db.commit()
                db.refresh(resume)
            except Exception:
                db.rollback()

        # Simple per-resume throttle: 1 request / 10s (after we know the resume exists).
        rid_key = str(rid)
        now_mono = time.monotonic()
        async with _last_analyze_lock:
            last = _last_analyze_by_resume.get(rid_key)
            if last is not None:
                elapsed = now_mono - last
                if elapsed < _ANALYZE_RESUME_COOLDOWN_SECONDS:
                    retry_after = int(_ANALYZE_RESUME_COOLDOWN_SECONDS - elapsed) + 1
                    raise HTTPException(
                        status_code=429,
                        detail=f"Too many analysis requests for this resume. Please wait {retry_after}s and try again.",
                        headers={"Retry-After": str(retry_after)},
                    )
            _last_analyze_by_resume[rid_key] = now_mono

        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "resume_analysis")

        content_len = len(resume.content.strip()) if resume.content else 0
        logger.info(
            "[POST analyze 04] extracted_text_ok resume_id=%s content_chars=%s",
            rid,
            content_len,
        )

        if not resume.content or content_len < 50:
            logger.warning(
                "[POST analyze] content_too_short resume_id=%s chars=%s",
                rid,
                content_len,
            )
            raise HTTPException(
                status_code=400,
                detail="Resume content is too short or missing. Please upload a valid resume.",
            )

        # Persist analysis lifecycle state so failures don't leave the resume in an unknown state.
        # We reuse `processing_status` as the durable analysis status:
        # - analyzing: analysis requested/in progress
        # - completed: last analysis attempt succeeded (and a ResumeAnalysis row exists)
        # - failed: last analysis attempt failed (Gemini unavailable, etc.)
        _touch_processing_status(resume, "analyzing")
        try:
            db.commit()
            db.refresh(resume)
            logger.info("[POST analyze 05] processing_status=analyzing committed resume_id=%s", rid)
        except Exception:
            db.rollback()
            logger.exception(
                "[POST analyze 05] processing_status_analyzing_commit_failed resume_id=%s",
                rid,
            )
            raise HTTPException(
                status_code=500,
                detail="Could not start analysis. Please try again.",
            )
        analysis_inflight = True

        job_description = body.job_description if body else None

        _rc = resume.content or ""
        print(
            "[ANALYZE PRE-GEMINI]",
            f"resume.id={resume.id}",
            f"content_len={len(_rc)}",
            f"first_300={_rc[:300]!r}",
            flush=True,
        )
        _jd = job_description if isinstance(job_description, str) else ""
        logger.info(
            "[POST analyze 06] pre_gemini resume_id=%s content_len=%s job_desc_chars=%s gemini_calls_expected=1",
            rid,
            len(_rc),
            len(_jd.strip()),
        )

        try:
            analysis_result = await get_gemini_service().analyze_resume_content(
                resume.content,
                job_description,
            )
            try:
                preview = json.dumps(analysis_result, default=str)[:2000]
            except Exception as dump_exc:
                preview = f"<preview_unserializable: {dump_exc}>"
                logger.warning(
                    "[POST analyze 07] gemini_success_preview_dump_failed resume_id=%s err=%s",
                    rid,
                    dump_exc,
                )
            print("[ANALYZE SUCCESS]", preview, flush=True)
            logger.info(
                "[POST analyze 07] gemini_succeeded resume_id=%s keys=%s",
                rid,
                list(analysis_result.keys())
                if isinstance(analysis_result, dict)
                else None,
            )
        except Exception as e:
            # Log internally, but do not expose raw errors upstream.
            print("[ANALYZE ERROR]", str(e), flush=True)
            logger.exception(
                "[POST analyze 07] gemini_failed resume_id=%s",
                rid,
            )
            # Mark failure durably so clients can stop trying to fetch non-existent analysis.
            try:
                _touch_processing_status(resume, "failed")
                db.commit()
                db.refresh(resume)
            except Exception:
                db.rollback()
            emsg = str(e) if e is not None else ""
            low = emsg.lower()
            if "quota" in low or "rate limit" in low or "resource exhausted" in low or "429" in low:
                # Surface a clear quota message so the frontend can show the real fix.
                raise HTTPException(
                    status_code=429,
                    detail=emsg
                    or "Gemini quota exceeded. Enable billing or wait before retrying.",
                ) from e
            if (
                "model not found" in low
                or "not available for this api key" in low
                or ("not found" in low and "models/" in low)
            ):
                raise HTTPException(status_code=502, detail=emsg) from e
            raise HTTPException(
                status_code=503,
                detail="AI temporarily unavailable. Please try again shortly.",
            ) from e

        if not isinstance(analysis_result, dict):
            logger.error(
                "[POST analyze] gemini_invalid_shape resume_id=%s type=%s",
                rid,
                type(analysis_result),
            )
            raise HTTPException(
                status_code=502,
                detail="Invalid analysis response from AI service.",
            )

        overall_raw = analysis_result.get("overall_score")
        if overall_raw is None:
            overall_raw = analysis_result.get("score")
        if overall_raw is None:
            raise HTTPException(
                status_code=502,
                detail="AI analysis response is missing score.",
            )
        ats_raw = analysis_result.get("ats_score")
        if ats_raw is None:
            raise HTTPException(
                status_code=502,
                detail="AI analysis response is missing ats_score.",
            )
        try:
            overall = float(overall_raw)
            ats = float(ats_raw)
        except (TypeError, ValueError) as conv_err:
            raise HTTPException(
                status_code=502,
                detail="AI analysis returned non-numeric scores.",
            ) from conv_err
        overall = max(0.0, min(100.0, overall))
        ats = max(0.0, min(100.0, ats))
        logger.info(
            "[POST analyze 08] scores_normalized resume_id=%s overall=%s ats=%s",
            rid,
            overall,
            ats,
        )

        safe_analysis_data = ensure_json_serializable(analysis_result)
        safe_strengths = ensure_json_serializable(analysis_result.get("strengths", []) or [])
        safe_recommendations = ensure_json_serializable(
            analysis_result.get("recommendations", []) or []
        )
        logger.info(
            "[POST analyze 09] json_safe_payload resume_id=%s strengths_type=%s recs_type=%s",
            rid,
            type(safe_strengths).__name__,
            type(safe_recommendations).__name__,
        )

        analysis = ResumeAnalysis(
            resume_id=resume.id,
            analysis_data=safe_analysis_data,
            overall_score=overall,
            ats_score=ats,
            strengths=safe_strengths if isinstance(safe_strengths, list) else [],
            recommendations=safe_recommendations if isinstance(safe_recommendations, list) else [],
        )

        try:
            logger.info("[POST analyze 10] db_insert_flush resume_id=%s", rid)
            db.add(analysis)
            db.flush()
            _touch_processing_status(resume, "completed")
            db.commit()
            db.refresh(analysis)
            print(
                "[DB SAVE]",
                analysis.id,
                analysis.overall_score,
                flush=True,
            )
            logger.info(
                "[POST analyze 10] db_insert_commit_ok resume_id=%s analysis_id=%s score=%s ats=%s",
                rid,
                analysis.id,
                analysis.overall_score,
                analysis.ats_score,
            )
        except Exception as db_err:
            db.rollback()
            logger.exception(
                "[POST analyze] db_insert_failed resume_id=%s err=%s",
                rid,
                db_err,
            )
            try:
                _touch_processing_status(resume, "failed")
                db.commit()
            except Exception:
                db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Analysis completed but could not be saved. Please try again.",
            ) from db_err

        readback = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.resume_id == rid)
            .order_by(desc(ResumeAnalysis.created_at))
            .first()
        )
        if not readback or readback.id != analysis.id:
            logger.error(
                "[POST analyze] verify_readback_failed resume_id=%s expected_analysis_id=%s readback=%s",
                rid,
                analysis.id,
                getattr(readback, "id", None),
            )
        else:
            logger.info(
                "[POST analyze] verify_readback_ok resume_id=%s analysis_id=%s",
                rid,
                analysis.id,
            )

        logger.info(
            "[POST analyze 11] response_ready resume_id=%s analysis_id=%s score=%s ats=%s",
            rid,
            analysis.id,
            analysis.overall_score,
            analysis.ats_score,
        )
        try:
            api_payload = build_analysis_api_dict(resume, analysis)
        except Exception as fmt_exc:
            logger.exception(
                "[POST analyze 11] build_analysis_api_dict_failed resume_id=%s analysis_id=%s",
                rid,
                getattr(analysis, "id", None),
            )
            raise HTTPException(
                status_code=502,
                detail="Analysis was saved but the API response could not be built. Try GET /api/resume/analyze/{id}.",
            ) from fmt_exc
        logger.info(
            "[POST analyze 12] response_payload resume_id=%s score=%s ats=%s "
            "strengths_len=%s weaknesses_len=%s suggestions_len=%s improvements_len=%s",
            rid,
            api_payload.get("score"),
            api_payload.get("ats_score"),
            len(api_payload.get("strengths") or []),
            len(api_payload.get("weaknesses") or []),
            len(api_payload.get("suggestions") or []),
            len(api_payload.get("improvements") or []),
        )
        return api_payload

    except HTTPException:
        if analysis_inflight:
            _release_stuck_analyzing(db, rid)
        raise
    except Exception as e:
        logger.exception("[POST analyze 99] unexpected_failure resume_id=%s err=%s", rid, e)
        if analysis_inflight:
            _release_stuck_analyzing(db, rid)
        detail = "Analysis failed"
        if getattr(settings, "DEBUG", False):
            detail = f"Analysis failed: {type(e).__name__}: {str(e)[:500]}"
        raise HTTPException(status_code=500, detail=detail) from e


@router.get("/analyze/{resume_id}")
async def get_latest_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the latest stored analysis (404 if none). Same shape as POST analyze."""
    rid = _resume_uuid_param(resume_id)
    logger.info(
        "[GET analyze] called resume_id=%s user_id=%s",
        rid,
        current_user.id,
    )
    resume = db.query(Resume).filter(
        Resume.id == rid,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        logger.warning(
            "[GET analyze] resume_not_found_for_user resume_id=%s user_id=%s",
            rid,
            current_user.id,
        )
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis_count_any = (
        db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == rid).count()
    )
    analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.resume_id == rid)
        .order_by(desc(ResumeAnalysis.created_at))
        .first()
    )
    if not analysis:
        logger.warning(
            "[GET analyze] no_analysis_row resume_id=%s user_id=%s "
            "resume_analyses_count_for_this_resume_id=%s (no row after order_by created_at desc)",
            rid,
            current_user.id,
            analysis_count_any,
        )
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this resume. Run analysis first.",
        )

    print("[GET ANALYSIS FOUND]", analysis.id, flush=True)
    logger.info(
        "[GET analyze] success resume_id=%s analysis_id=%s created_at=%s",
        rid,
        analysis.id,
        analysis.created_at,
    )
    return build_analysis_api_dict(resume, analysis)


@router.post("/enhance/{resume_id}")
async def enhance_resume(
    resume_id: str,
    job_description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rid = _resume_uuid_param(resume_id)
    resume = db.query(Resume).filter(
        Resume.id == rid,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        latest = (
            db.query(ResumeAnalysis)
            .filter(ResumeAnalysis.resume_id == resume.id)
            .order_by(desc(ResumeAnalysis.created_at))
            .first()
        )
        feedback_context = None
        if latest:
            feedback_context = {
                "strengths": latest.strengths,
                "recommendations": latest.recommendations,
                "analysis_data": latest.analysis_data,
            }

        enhanced_content = await get_gemini_service().enhance_resume_with_gemini(
            resume.content or "",
            job_description,
            feedback_context,
        )

        version_number = db.query(ResumeVersion).filter(
            ResumeVersion.resume_id == resume.id
        ).count() + 1

        version = ResumeVersion(
            resume_id=resume.id,
            content=enhanced_content,
            version_number=version_number
        )
        db.add(version)
        db.commit()

        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.RESUME_ENHANCE,
            metadata={
                "version": version_number,
                "has_job_description": bool(job_description and str(job_description).strip()),
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


@router.post("/fix")
async def fix_resume(
    body: FixResumeBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Same as POST /api/resume/enhance/{resume_id} but accepts JSON body (legacy UI / BFF)."""
    return await enhance_resume(
        body.resume_id,
        body.job_description,
        current_user,
        db,
    )


@router.post("/cover-letter/{resume_id}", response_model=CoverLetterResponse)
async def generate_cover_letter(
    resume_id: str,
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(
        "Cover letter generation started for resume %s user %s",
        resume_id,
        current_user.id,
    )

    resume = _resolve_resume_for_cover_letter(resume_id, current_user, db)

    logger.info("Resume resolved: id=%s filename=%s", resume.id, resume.filename)

    resume_text_content = (resume.content or "").strip()
    logger.info(
        "Resume content length: %s chars",
        len(resume_text_content) if resume_text_content else 0,
    )
    if len(resume_text_content) < _COVER_LETTER_MIN_RESUME_CHARS:
        raise HTTPException(
            status_code=400,
            detail=(
                "This resume has too little text to ground a cover letter. "
                "Re-upload the file, wait for processing to finish, or add content in the resume editor."
            ),
        )

    job_desc = (request.job_description or "").strip()
    if len(job_desc) < 40:
        raise HTTPException(
            status_code=400,
            detail="Job description is required (paste the full posting or a substantial excerpt so the letter can name the company and role).",
        )

    try:
        logger.info("Calling Gemini API for cover letter")
        cover_letter = await get_gemini_service().generate_cover_letter(
            resume_text_content,
            job_desc,
        )
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("Cover letter validation / AI error: %s", e)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception:
        logger.exception("Cover letter generation failed")
        raise HTTPException(
            status_code=503,
            detail="Cover letter generation failed. Please try again in a moment.",
        ) from None

    if not (cover_letter or "").strip():
        raise HTTPException(
            status_code=503,
            detail="Cover letter generation produced no text. Please try again.",
        )

    logger.info("Cover letter generated (%s chars)", len(cover_letter))

    analytics = Analytics(
        user_id=current_user.id,
        resume_id=resume.id,
        action_type=ActionType.COVER_LETTER_GENERATION,
        metadata={
            "job_description_chars": len(job_desc),
            "resume_chars": len(resume_text_content),
            "resume_path": (resume_id or "").strip().lower(),
        },
    )
    db.add(analytics)
    db.commit()

    return CoverLetterResponse(cover_letter=cover_letter.strip())

@router.post("/learning-path/{resume_id}")
async def generate_learning_path(
    resume_id: str,
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rid = _resume_uuid_param(resume_id)
    resume = db.query(Resume).filter(
        Resume.id == rid,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    try:
        # Generate learning path using the text content
        resume_text_content = (resume.content or "").strip()
        
        if not resume_text_content:
            raise HTTPException(status_code=400, detail="Resume content not available for learning path generation")
            
        learning_path = await get_gemini_service().generate_learning_path(
            resume_text_content,
            request.job_description,
        )

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
    num_questions: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a custom practice exam based on resume and job requirements"""
    logger.info(
        "Practice exam request resume=%s user=%s job_desc=%s len=%s",
        resume_id,
        current_user.id,
        bool(request.job_description),
        len(request.job_description) if request.job_description else 0,
    )

    rid = _resume_uuid_param(resume_id)
    resume = db.query(Resume).filter(
        Resume.id == rid,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        logger.warning("Resume not found: %s", resume_id)
        raise HTTPException(status_code=404, detail="Resume not found")

    logger.info("Resume found: %s content_len=%s", resume.filename, len(resume.content) if resume.content else 0)

    try:
        logger.info("Calling Gemini API for practice exam")
        practice_exam = await get_gemini_service().generate_practice_exam(
            resume.content or "",
            request.job_description,
            num_questions,
        )
        logger.info(
            "Practice exam generated title=%s questions=%s",
            practice_exam.get("exam_info", {}).get("title", "Unknown"),
            len(practice_exam.get("questions", [])),
        )

        logger.info("Practice exam generated (not persisted on Resume row — returned in response)")

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.PRACTICE_EXAM_GENERATION
        )
        db.add(analytics)
        db.commit()
        logger.info("Practice exam analytics tracked")

        return practice_exam

    except Exception as e:
        logger.exception("Practice exam generation failed")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.upload_date.desc()).all()

@router.get("/history")
async def get_resume_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Paginated resume list aligned with the Next.js UI (resumes, practice exams, etc.).
    """
    try:
        data_service = get_data_service(db)
        DataSourceValidator.log_data_source_usage(data_service, "resume_history")

        resumes = data_service.get_user_resumes(current_user.id)
        total = len(resumes)
        start = (page - 1) * limit
        chunk = resumes[start : start + limit]
        total_pages = (total + limit - 1) // limit if total else 1

        logger.info(
            "Retrieved %s real resumes for user %s (page %s/%s)",
            len(chunk),
            current_user.id,
            page,
            total_pages,
        )
        return {
            "resumes": chunk,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": total_pages,
            },
        }

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

@router.post("/{resume_id}/update")
async def update_resume_content(
    resume_id: str,
    payload: ResumeContentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist edited resume body text for the resume editor."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.content = payload.content
    resume.character_count = len(payload.content)
    db.commit()
    db.refresh(resume)
    return {"message": "Resume updated successfully", "resume_id": str(resume.id)}


@router.get("/latest", response_model=ResumeResponse)
async def get_latest_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's most recently uploaded resume (same row ordering as ``latest`` for cover letters)."""
    resume = _get_user_latest_resume(db, current_user.id)
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Upload a resume first.",
        )
    return resume


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rid = _resume_uuid_param(resume_id)
    logger.info("[GET resume] called resume_id=%s user_id=%s", rid, current_user.id)
    resume = db.query(Resume).filter(
        Resume.id == rid,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        logger.warning(
            "[GET resume] not_found resume_id=%s user_id=%s", rid, current_user.id
        )
        raise HTTPException(status_code=404, detail="Resume not found")

    return resume

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a resume and dependent rows. FK children must be removed first or
    PostgreSQL raises IntegrityError (delete was failing silently before).
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    rid = resume.id
    try:
        db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == rid).delete(
            synchronize_session=False
        )
        db.query(ResumeVersion).filter(ResumeVersion.resume_id == rid).delete(
            synchronize_session=False
        )
        db.query(Analytics).filter(Analytics.resume_id == rid).update(
            {Analytics.resume_id: None},
            synchronize_session=False,
        )
        db.query(JobApplication).filter(JobApplication.resume_id == rid).update(
            {JobApplication.resume_id: None},
            synchronize_session=False,
        )
        db.delete(resume)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("delete_resume failed for %s: %s", resume_id, e)
        raise HTTPException(
            status_code=500,
            detail="Could not delete resume. It may still be referenced elsewhere.",
        ) from e

    return {"message": "Resume deleted successfully"}

@router.get("/feedback-history")
async def get_feedback_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Paginated analysis history (stored ResumeAnalysis rows) for the feedback history UI."""
    try:
        offset = (page - 1) * limit

        q = (
            db.query(ResumeAnalysis)
            .join(Resume, Resume.id == ResumeAnalysis.resume_id)
            .filter(Resume.user_id == current_user.id)
        )
        total_count = q.count()

        analyses = (
            q.order_by(desc(ResumeAnalysis.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        results = []
        for analysis in analyses:
            resume = db.query(Resume).filter(Resume.id == analysis.resume_id).first()
            payload = (
                analysis.analysis_data
                if isinstance(analysis.analysis_data, dict)
                else {}
            )
            results.append(
                {
                    "id": str(analysis.id),
                    "resume_id": str(analysis.resume_id),
                    "resume_filename": resume.filename if resume else "Unknown",
                    "feedback_text": json.dumps(payload) if payload else "{}",
                    "score": float(analysis.overall_score),
                    "ai_analysis_version": "ai_feedback_v1",
                    "created_at": analysis.created_at.isoformat()
                    if analysis.created_at
                    else "",
                    "resume_created_at": resume.upload_date.isoformat()
                    if resume and resume.upload_date
                    else None,
                }
            )

        total_pages = (total_count + limit - 1) // limit if total_count else 0
        has_next = page < total_pages if total_pages else False
        has_prev = page > 1

        return {
            "feedback_history": results,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_count,
                "items_per_page": limit,
                "has_next": has_next,
                "has_prev": has_prev,
            },
        }

    except Exception as e:
        logger.error("Error getting feedback history: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to get feedback history")

# Removed unused debug endpoint 
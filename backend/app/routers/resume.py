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
from ..models.resume import Resume, ResumeVersion, ResumeAnalysis, ResumeAnalysisRequest
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
    gemini_service,
    GeminiService
)
from .auth import get_current_user_test, get_current_user
from ..middleware.subscription import check_subscription_access, decrement_enhancements
from ..services.real_data_service import get_data_service, DataSourceValidator
from ..utils.file_processing import save_uploaded_file, extract_text_from_file, cleanup_temp_file, get_file_info
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter()

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
    current_user: User = Depends(get_current_user_test),
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
        
        # Use existing Gemini service for analysis
        from ..services.gemini_service import gemini_service
        
        try:
            # Analyze real resume content
            analysis_result = await gemini_service.analyze_resume_content(
                resume.content, 
                job_description
            )
            
            # Save real analysis to database
            analysis = ResumeAnalysis(
                resume_id=resume_id,
                user_id=current_user.id,
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
            logger.error(f"AI analysis failed: {str(ai_error)}")
            # Return fallback analysis rather than complete failure
            fallback_analysis = {
                "analysis_id": None,
                "overall_score": 50,
                "ats_score": 45,
                "strengths": ["Resume uploaded successfully"],
                "feedback": [{
                    "category": "technical",
                    "priority": "medium",
                    "job_wants": "AI analysis",
                    "you_have": "Valid resume content",
                    "fix": "AI analysis temporarily unavailable. Please try again later.",
                    "example": "Your resume content has been processed successfully",
                    "bonus": "Consider trying again in a few minutes"
                }],
                "recommendations": ["Try analysis again later", "Ensure strong internet connection"],
                "data_source": "fallback_analysis",
                "error": "AI analysis temporarily unavailable"
            }
            return fallback_analysis
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@router.post("/enhance/{resume_id}")
async def enhance_resume(
    resume_id: str,
    job_description: Optional[str] = None,
    current_user: User = Depends(get_current_user_test),
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

@router.post("/cover-letter/{resume_id}")
async def generate_cover_letter(
    resume_id: str,
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user_test),
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
        resume_text_content = resume.content or resume.enhanced_content or resume.original_content
        print(f"📄 Using resume content: {len(resume_text_content) if resume_text_content else 0} characters")
        
        if not resume_text_content:
            raise HTTPException(status_code=400, detail="Resume content not available for cover letter generation")
        
        cover_letter = await gemini_service.generate_cover_letter(
            resume_text_content,
            request.job_description,
            request.job_title,
            request.company_name
        )
        
        print(f"✅ Cover letter generated successfully (length: {len(cover_letter)} chars)")

        # Update resume
        resume.cover_letter = cover_letter
        db.commit()

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

        return {"cover_letter": cover_letter}

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
    current_user: User = Depends(get_current_user_test),
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
    current_user: User = Depends(get_current_user_test),
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
    current_user: User = Depends(get_current_user_test),
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
    current_user: User = Depends(get_current_user_test),
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
    current_user: User = Depends(get_current_user_test),
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
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
from ..models.resume import Resume, ResumeVersion, FeedbackHistory
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
    generate_learning_path_with_gemini,
    generate_practice_exam_with_gemini
)
from .auth import get_current_user_test, get_current_user
from ..middleware.subscription import check_subscription_access, decrement_enhancements

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user_test),
    db: Session = Depends(get_db)
):
    print("=== BACKEND RESUME UPLOAD DEBUG ===")
    print(f"1. User ID: {current_user.id}")
    print(f"2. User email: {current_user.email}")
    print(f"3. User subscription: {current_user.subscription_type}")
    print(f"4. File details: name={file.filename}, content_type={file.content_type}")
    print(f"5. Job description provided: {bool(job_description)}")
    
    try:
        # TEMPORARILY DISABLED: Check subscription - provide detailed error message
        # if current_user.subscription_type == SubscriptionType.FREE:
        #     print("❌ Subscription check failed: User has FREE subscription")
        #     raise HTTPException(
        #         status_code=403, 
        #         detail="Resume upload requires a paid subscription. Please upgrade to upload resumes."
        #     )
        
        print("✅ Subscription check passed (TEMPORARILY DISABLED FOR FREE UPLOADS)")
        
        # Validate file
        if not file.filename:
            print("❌ File validation failed: No filename")
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file size (max 10MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        await file.seek(0)  # Reset file pointer
        
        print(f"7. File size: {file_size} bytes")
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            print("❌ File validation failed: File too large")
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        if file_size == 0:
            print("❌ File validation failed: Empty file")
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            print(f"❌ File validation failed: Invalid content type {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail=f"File type not supported. Please upload PDF or DOCX files. Received: {file.content_type}"
            )
        
        print("✅ File validation passed")
        
        # Process file content
        if file.content_type == 'application/pdf':
            print("8. Processing PDF file...")
            # Read PDF content
            try:
                import PyPDF2
                import io
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text()
                print(f"✅ PDF processed, extracted {len(text_content)} characters")
            except Exception as e:
                print(f"❌ PDF processing failed: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Failed to process PDF file: {str(e)}")
        else:
            print("8. Processing DOCX file...")
            # Read DOCX content
            try:
                from docx import Document
                import io
                doc = Document(io.BytesIO(content))
                text_content = ""
                for paragraph in doc.paragraphs:
                    text_content += paragraph.text + "\n"
                print(f"✅ DOCX processed, extracted {len(text_content)} characters")
            except Exception as e:
                print(f"❌ DOCX processing failed: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Failed to process DOCX file: {str(e)}")
        
        if not text_content.strip():
            print("❌ Content extraction failed: No text found")
            raise HTTPException(status_code=400, detail="No text content found in the uploaded file")
        
        print(f"9. Creating resume record in database...")
        
        # Create resume record
        resume = Resume(
            user_id=current_user.id,
            content=text_content,
            job_description=job_description,
            filename=file.filename
        )
        
        db.add(resume)
        db.commit()
        db.refresh(resume)
        
        print(f"✅ Resume created with ID: {resume.id}")
        print("=== END BACKEND DEBUG ===")
        
        return {
            "id": resume.id,
            "message": "Resume uploaded successfully",
            "content": text_content[:500] + "..." if len(text_content) > 500 else text_content,
            "filename": file.filename
        }
        
    except HTTPException:
        print("=== END BACKEND DEBUG (HTTP Exception) ===")
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        print("=== END BACKEND DEBUG (Unexpected Error) ===")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/analyze/{resume_id}")
async def analyze_resume(
    resume_id: str,
    job_description: Optional[str] = None,
    current_user: User = Depends(get_current_user_test),
    db: Session = Depends(get_db)
):
    print(f"🔍 Analyzing resume ID: {resume_id}")
    
    # Get resume
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        print(f"❌ Resume not found: {resume_id}")
        raise HTTPException(status_code=404, detail="Resume not found")

    print(f"✅ Resume found: {resume.filename}")
    print(f"📄 Content length: {len(resume.content) if resume.content else 0} characters")
    print(f"💼 Job description provided: {bool(job_description)}")

    try:
        # Use real Gemini analysis
        print("🤖 Starting Gemini AI analysis...")
        analysis = await analyze_resume_with_gemini(
            resume.content,
            job_description or resume.job_description
        )
        
        print(f"✅ Gemini analysis completed - Score: {analysis.score}")

        # Convert analysis object to dict for database storage and frontend
        analysis_dict = {
            "score": analysis.score,
            "strengths": analysis.strengths,  # Add missing strengths field
            "feedback": analysis.feedback,
            "extracted_info": analysis.extracted_info,
            "job_matches": analysis.job_matches,
            "improvements": analysis.improvements
        }
        
        print(f"🔍 Analysis dict feedback categories: {len(analysis_dict['feedback'])}")
        print(f"🔍 Analysis dict strengths: {len(analysis_dict['strengths'])}")
        if analysis_dict['feedback']:
            for i, cat in enumerate(analysis_dict['feedback']):
                print(f"  Category {i}: {cat.get('category')} with {len(cat.get('items', []))} items")
                if cat.get('items'):
                    first_item = cat['items'][0]
                    print(f"    First item job_wants: '{first_item.get('job_wants', 'EMPTY')}'")
                    print(f"    First item fix: '{first_item.get('fix', 'EMPTY')}'")
        else:
            print("⚠️ No feedback categories in analysis_dict!")

        # Update resume with analysis results
        resume.score = analysis.score
        resume.feedback = analysis.feedback
        resume.extracted_info = analysis.extracted_info
        resume.job_matches = analysis.job_matches
        resume.improvements = analysis.improvements
        db.commit()

        # Save feedback to history
        feedback_history = FeedbackHistory(
            user_id=current_user.id,
            resume_id=resume.id,
            feedback_text=json.dumps(analysis.feedback),
            score=analysis.score,
            ai_analysis_version="v1.0"
        )
        db.add(feedback_history)

        # Track analytics
        analytics = Analytics(
            user_id=current_user.id,
            resume_id=resume.id,
            action_type=ActionType.RESUME_ANALYSIS,
            metadata={
                "has_job_description": bool(job_description),
                "score": analysis.score,
                "feedback_categories": len(analysis.feedback)
            }
        )
        db.add(analytics)
        db.commit()

        print(f"✅ Analysis completed and saved for resume {resume_id}")
        return analysis_dict

    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        # Return a more detailed error message
        error_message = f"Failed to analyze resume: {str(e)}"
        if "API key" in str(e).lower():
            error_message = "Gemini API key not configured properly"
        elif "quota" in str(e).lower():
            error_message = "API quota exceeded. Please try again later"
        elif "json" in str(e).lower():
            error_message = "Failed to parse AI response. Please try again"
        
        raise HTTPException(status_code=500, detail=error_message)

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
        
        cover_letter = await generate_cover_letter_with_gemini(
            resume_text_content,
            request.job_description,
            None  # company_info not used for now
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
            
        learning_path = await generate_learning_path_with_gemini(
            resume_text_content,
            request.job_description,
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
        practice_exam = await generate_practice_exam_with_gemini(
            resume.content,
            request.job_description,
            learning_plan
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
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    current_user: User = Depends(get_current_user_test),
    db: Session = Depends(get_db)
):
    """Get paginated resumes with their analysis data for the current user"""
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get total count
    total_count = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).count()
    
    # Get paginated resumes
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).offset(offset).limit(limit).all()
    
    history_data = []
    for resume in resumes:
        # Check which features are available
        has_feedback = resume.feedback is not None
        has_cover_letter = resume.cover_letter is not None and resume.cover_letter.strip() != ""
        has_learning_path = resume.learning_path is not None
        has_practice_exam = resume.practice_exam is not None
        
        history_data.append({
            "id": str(resume.id),
            "filename": resume.filename,
            "content": resume.content[:500] + "..." if resume.content and len(resume.content) > 500 else resume.content,
            "enhanced_content": resume.enhanced_content,
            "score": resume.score,
            "feedback": resume.feedback,
            "extracted_info": resume.extracted_info,
            "job_matches": resume.job_matches,
            "improvements": resume.improvements,
            "job_description": resume.job_description,
            "cover_letter": resume.cover_letter,
            "learning_path": resume.learning_path,
            "practice_exam": resume.practice_exam,
            "created_at": resume.created_at.isoformat(),
            "updated_at": resume.updated_at.isoformat(),
            # Status indicators
            "has_feedback": has_feedback,
            "has_cover_letter": has_cover_letter,
            "has_learning_path": has_learning_path,
            "has_practice_exam": has_practice_exam
        })
    
    return {
        "resumes": history_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit
        }
    }

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
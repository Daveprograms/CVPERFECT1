"""
Interview Router
Endpoints for interview preparation and practice
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User, Resume, InterviewSession, InterviewQuestion, SessionStatus
from ..schemas.interview import (
    QuestionGenerateRequest,
    QuestionGenerateResponse,
    GeneratedQuestion,
    InterviewSessionCreate,
    InterviewSessionResponse,
    InterviewQuestionResponse,
    AnswerSubmit,
    AnswerFeedback,
    SessionFeedback,
    InterviewTips,
    CompanyPrep
)
from ..core.dependencies import get_current_user
from ..services.gemini_service import get_gemini_service

router = APIRouter()


@router.post("/generate-questions", response_model=QuestionGenerateResponse)
async def generate_questions(
    request: QuestionGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate practice interview questions"""
    # Get resume content if provided
    resume_content = None
    if request.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == request.resume_id,
            Resume.user_id == str(current_user.id)
        ).first()
        if resume:
            resume_content = resume.content
    
    # Generate questions using AI
    questions = await get_gemini_service().generate_interview_questions(
        job_title=request.job_title,
        company_name=request.company_name,
        resume_content=resume_content,
        question_type=request.question_type.value if request.question_type else None,
        difficulty=request.difficulty.value,
        count=request.count
    )
    
    # Convert to response format
    generated_questions = [GeneratedQuestion(**q) for q in questions]
    
    return QuestionGenerateResponse(
        questions=generated_questions,
        total_count=len(generated_questions)
    )


@router.post("/sessions", response_model=InterviewSessionResponse, status_code=201)
async def create_session(
    session_data: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new mock interview session"""
    # Get resume content if provided
    resume_content = None
    if session_data.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == session_data.resume_id,
            Resume.user_id == str(current_user.id)
        ).first()
        if resume:
            resume_content = resume.content
    
    # Generate initial questions
    questions = await get_gemini_service().generate_interview_questions(
        job_title=session_data.job_title,
        company_name=session_data.company_name,
        resume_content=resume_content,
        question_type=session_data.session_type.value,
        count=5
    )
    
    # Create session
    session = InterviewSession(
        user_id=str(current_user.id),
        job_title=session_data.job_title,
        company_name=session_data.company_name,
        session_type=session_data.session_type,
        total_questions=len(questions)
    )
    
    db.add(session)
    db.flush()
    
    # Add questions to session
    for q in questions:
        question = InterviewQuestion(
            session_id=session.id,
            question_text=q['question_text'],
            question_type=q['question_type'],
            difficulty=q['difficulty'],
            category=q.get('category'),
            hints=q.get('hints', []),
            sample_answer=q.get('sample_answer')
        )
        db.add(question)
    
    db.commit()
    db.refresh(session)
    
    return session


@router.get("/sessions", response_model=List[InterviewSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all interview sessions for the current user"""
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == str(current_user.id)
    ).order_by(InterviewSession.started_at.desc()).all()
    
    return sessions


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview session details with questions"""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == str(current_user.id)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.post("/sessions/{session_id}/answer", response_model=AnswerFeedback)
async def submit_answer(
    session_id: str,
    answer_data: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer to a question and get AI feedback"""
    # Verify session belongs to user
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == str(current_user.id)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not in progress")
    
    # Get question
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == answer_data.question_id,
        InterviewQuestion.session_id == session_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Evaluate answer using AI
    feedback = await get_gemini_service().evaluate_interview_answer(
        question=question.question_text,
        answer=answer_data.answer,
        question_type=question.question_type.value,
        job_title=session.job_title
    )
    
    # Update question with answer and feedback
    question.user_answer = answer_data.answer
    question.ai_feedback = feedback
    question.score = feedback.get('score', 0)
    
    # Update session progress
    session.questions_answered += 1
    
    db.commit()
    
    return AnswerFeedback(**feedback)


@router.post("/sessions/{session_id}/complete", response_model=SessionFeedback)
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete the session and get overall feedback"""
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == str(current_user.id)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session already completed")
    
    # Get all questions with answers
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).all()
    
    # Calculate overall score
    answered_questions = [q for q in questions if q.user_answer]
    if answered_questions:
        overall_score = sum(q.score or 0 for q in answered_questions) / len(answered_questions)
    else:
        overall_score = 0
    
    # Generate overall feedback
    question_breakdown = [
        {
            "question": q.question_text,
            "type": q.question_type.value,
            "score": q.score,
            "answered": bool(q.user_answer)
        }
        for q in questions
    ]
    
    strengths = []
    improvements = []
    
    for q in answered_questions:
        if q.ai_feedback:
            strengths.extend(q.ai_feedback.get('strengths', []))
            improvements.extend(q.ai_feedback.get('improvements', []))
    
    # Update session
    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    session.overall_score = overall_score
    session.duration = int((datetime.utcnow() - session.started_at).total_seconds() / 60)
    session.feedback = {
        "overall_score": overall_score,
        "strengths": list(set(strengths))[:5],
        "improvements": list(set(improvements))[:5]
    }
    
    db.commit()
    
    return SessionFeedback(
        overall_score=overall_score,
        strengths=list(set(strengths))[:5],
        areas_for_improvement=list(set(improvements))[:5],
        question_breakdown=question_breakdown,
        recommendations=[
            "Practice more questions in areas where you scored below 70",
            "Review the sample answers for questions you struggled with",
            "Focus on providing specific examples in behavioral questions"
        ],
        next_steps=[
            "Schedule another practice session",
            "Review company-specific preparation materials",
            "Practice with a friend or mentor"
        ]
    )


@router.get("/tips/{job_role}", response_model=InterviewTips)
async def get_interview_tips(
    job_role: str,
    company_name: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get interview tips for a specific role"""
    tips = await get_gemini_service().generate_interview_tips(
        job_role=job_role,
        company_name=company_name
    )
    
    return InterviewTips(
        job_role=job_role,
        **tips
    )


@router.get("/company-prep/{company}", response_model=CompanyPrep)
async def get_company_prep(
    company: str,
    job_role: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get company-specific interview preparation"""
    prep = await get_gemini_service().generate_company_prep(
        company_name=company,
        job_role=job_role
    )
    
    return CompanyPrep(
        company_name=company,
        **prep
    )

"""
AI Chat Router
Career assistant powered by Gemini AI with persistent conversation history
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..database import get_db
from ..models.chat import ChatMessage, MessageRole
from ..core.dependencies import get_current_user
from ..models.user import User
from ..services.gemini_service import get_gemini_service
from pydantic import BaseModel

router = APIRouter()


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[str] = None
    resume_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    session_id: str
    messages: List[ChatMessageResponse]
    message_count: int


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    body: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI career assistant and get a response.
    Maintains conversation history per session.
    """
    # Create or reuse session
    session_id = body.session_id or str(uuid.uuid4())

    # Save user message
    user_msg = ChatMessage(
        user_id=str(current_user.id),
        session_id=session_id,
        role=MessageRole.USER,
        content=body.content,
        resume_id=body.resume_id
    )
    db.add(user_msg)
    db.commit()

    # Fetch conversation history for context (last 20 messages)
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == str(current_user.id),
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).limit(20).all()

    # Build conversation context string
    context_lines = []
    for msg in history[:-1]:  # exclude the message we just saved
        prefix = "User" if msg.role == MessageRole.USER else "Assistant"
        context_lines.append(f"{prefix}: {msg.content}")

    context = "\n".join(context_lines)

    # Build prompt for Gemini
    system_prompt = f"""You are CVPerfect's AI Career Assistant — a world-class career coach 
specializing in resumes, job searching, interview prep, and professional development.

User profile:
- Name: {current_user.full_name or 'Job Seeker'}
- Current role: {current_user.current_role or 'Not specified'}
- Job search status: {current_user.job_search_status or 'Actively searching'}
- Subscription: {current_user.subscription_type.value}

Be concise, encouraging, and practical. Give specific, actionable advice.
Always focus on what will help them get hired faster.

Previous conversation:
{context if context else 'This is the start of the conversation.'}

Current user message: {body.content}

Respond as the AI Career Assistant:"""

    try:
        ai_response = await get_gemini_service().generate_text(system_prompt)
    except Exception as e:
        ai_response = (
            "I'm having trouble connecting to the AI service right now. "
            "Please try again in a moment. In the meantime, feel free to review "
            "your resume analysis results in your dashboard!"
        )

    # Save assistant response
    assistant_msg = ChatMessage(
        user_id=str(current_user.id),
        session_id=session_id,
        role=MessageRole.ASSISTANT,
        content=ai_response,
        resume_id=body.resume_id
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.get("/history", response_model=ChatSessionResponse)
async def get_chat_history(
    session_id: Optional[str] = Query(None, description="Session ID — omit to get latest session"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a session (or the latest session if session_id omitted)"""
    query = db.query(ChatMessage).filter(
        ChatMessage.user_id == str(current_user.id)
    )

    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    else:
        # Get the latest session
        latest = db.query(ChatMessage.session_id).filter(
            ChatMessage.user_id == str(current_user.id)
        ).order_by(ChatMessage.created_at.desc()).first()

        if not latest:
            return ChatSessionResponse(session_id="", messages=[], message_count=0)
        session_id = latest.session_id
        query = query.filter(ChatMessage.session_id == session_id)

    messages = query.order_by(ChatMessage.created_at.asc()).limit(limit).all()

    return ChatSessionResponse(
        session_id=session_id,
        messages=messages,
        message_count=len(messages)
    )


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all chat sessions for the current user"""
    from sqlalchemy import func, distinct

    sessions_data = db.query(
        ChatMessage.session_id,
        func.count(ChatMessage.id).label("message_count"),
        func.max(ChatMessage.created_at).label("last_message_at"),
        func.min(ChatMessage.created_at).label("started_at")
    ).filter(
        ChatMessage.user_id == str(current_user.id)
    ).group_by(ChatMessage.session_id).order_by(
        func.max(ChatMessage.created_at).desc()
    ).all()

    return [
        {
            "session_id": s.session_id,
            "message_count": s.message_count,
            "last_message_at": s.last_message_at.isoformat() if s.last_message_at else None,
            "started_at": s.started_at.isoformat() if s.started_at else None,
        }
        for s in sessions_data
    ]


@router.delete("/session/{session_id}", status_code=204)
async def clear_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all messages in a chat session"""
    deleted = db.query(ChatMessage).filter(
        ChatMessage.user_id == str(current_user.id),
        ChatMessage.session_id == session_id
    ).delete()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Session not found")

    db.commit()
    return None


@router.delete("/history", status_code=204)
async def clear_all_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete ALL chat history for the current user"""
    db.query(ChatMessage).filter(
        ChatMessage.user_id == str(current_user.id)
    ).delete()
    db.commit()
    return None

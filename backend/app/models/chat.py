"""
Chat Message Model
Stores AI chat conversations per user session
"""
from sqlalchemy import Column, String, DateTime, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from ..database import Base


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(Base):
    """Chat message model for AI career assistant"""
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=False, index=True)

    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)

    # Optional context linking
    resume_id = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Index for fast session queries
    __table_args__ = (
        Index("ix_chat_user_session", "user_id", "session_id"),
    )

    def __repr__(self):
        return f"<ChatMessage {self.role} in session {self.session_id}>"

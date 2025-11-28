"""
Interview Question Model
Stores individual interview questions and answers
"""
from sqlalchemy import Column, String, Float, Text, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
import enum
import uuid

from ..database import Base


class QuestionType(str, enum.Enum):
    """Question type enum"""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SITUATIONAL = "situational"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"


class QuestionDifficulty(str, enum.Enum):
    """Question difficulty enum"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewQuestion(Base):
    """Interview question model"""
    __tablename__ = "interview_questions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    
    # Question details
    question_text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    difficulty = Column(SQLEnum(QuestionDifficulty), default=QuestionDifficulty.MEDIUM)
    category = Column(String)  # e.g., "algorithms", "leadership", etc.
    
    # User response
    user_answer = Column(Text)
    
    # AI evaluation
    ai_feedback = Column(JSON)  # Detailed feedback
    score = Column(Float)  # 0-100 score for this question
    
    # Hints and guidance
    hints = Column(JSON)  # List of hints
    sample_answer = Column(Text)  # Example answer
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    
    def __repr__(self):
        return f"<InterviewQuestion {self.question_type} - {self.difficulty}>"

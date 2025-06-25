from typing import Tuple, Dict, Any, List
import json
from sqlalchemy.orm import Session
from ..models.resume import Resume
import os
from dotenv import load_dotenv

load_dotenv()

async def enhance_resume(resume_id: int, job_description: str, db: Session) -> None:
    """Enhance a resume using AI."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        return

    # For testing without Google AI, return the original content
    enhanced_content = resume.original_content

    # Create new version
    from ..models.resume import ResumeVersion
    version = ResumeVersion(
        resume_id=resume.id,
        content=enhanced_content,
        version_number=len(resume.versions) + 1,
        changes={"type": "enhancement", "job_description": job_description}
    )
    db.add(version)

    # Update resume
    resume.enhanced_content = enhanced_content
    db.commit()

async def score_resume(resume_content: str, job_description: str) -> Tuple[float, Dict[str, Any], List[Dict[str, Any]]]:
    """Score a resume and provide feedback."""
    prompt = f"""
    You are an expert resume reviewer and career coach. Your task is to score the following resume and provide detailed feedback.
    
    Job Description:
    {job_description}
    
    Resume:
    {resume_content}
    
    Please provide:
    1. A score from 1-10
    2. Detailed feedback in the following categories:
       - Content
       - Format
       - Keywords
       - Achievements
       - Overall Impact
    3. Learning suggestions with specific resources (courses, books, etc.)
    
    Return the response in JSON format:
    {{
        "score": float,
        "feedback": {{
            "content": str,
            "format": str,
            "keywords": str,
            "achievements": str,
            "overall_impact": str
        }},
        "learning_suggestions": [
            {{
                "topic": str,
                "suggestion": str,
                "resources": [str]
            }}
        ]
    }}
    """

    try:
        response = await model.generate_content(prompt)
        result = json.loads(response.text)
        return result["score"], result["feedback"], result["learning_suggestions"]
    except Exception as e:
        print(f"Error scoring resume: {e}")
        raise

async def generate_cover_letter(
    resume_content: str,
    job_description: str,
    company_name: str,
    position: str
) -> str:
    """Generate a cover letter using AI."""
    prompt = f"""
    You are an expert cover letter writer. Your task is to write a compelling cover letter based on the following information.
    
    Job Description:
    {job_description}
    
    Company: {company_name}
    Position: {position}
    
    Candidate's Resume:
    {resume_content}
    
    Please write a professional cover letter that:
    1. Highlights relevant experience and skills
    2. Shows enthusiasm for the company and position
    3. Demonstrates understanding of the role
    4. Maintains a professional yet engaging tone
    5. Is concise and impactful
    
    Format the cover letter professionally with proper spacing and paragraphs.
    """

    try:
        response = await model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating cover letter: {e}")
        raise



async def generate_resume_snapshot(
    resume_content: str,
    score: float,
    feedback: Dict[str, Any],
    learning_suggestions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate a shareable resume snapshot."""
    prompt = f"""
    Create a concise, shareable summary of this resume's performance.
    
    Resume Score: {score}/10
    
    Feedback:
    {json.dumps(feedback, indent=2)}
    
    Learning Suggestions:
    {json.dumps(learning_suggestions, indent=2)}
    
    Please provide:
    1. A brief feedback summary (2-3 sentences)
    2. A learning suggestions summary (2-3 sentences)
    3. A shareable text for social media
    
    Return the response in JSON format.
    """

    try:
        response = await model.generate_content(prompt)
        result = json.loads(response.text)
        
        # TODO: Generate and upload image to cloud storage
        # For now, return a placeholder URL
        result["image_url"] = "https://cvperfect.vercel.app/snapshot-placeholder.png"
        
        return result
    except Exception as e:
        print(f"Error generating resume snapshot: {e}")
        raise 
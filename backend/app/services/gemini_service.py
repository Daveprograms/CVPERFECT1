import google.generativeai as genai
from typing import Dict, List, Optional, Any
import json
import os
from ..config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class ResumeAnalysis:
    def __init__(
        self,
        score: float,
        feedback: List[Dict[str, Any]],
        extracted_info: Dict[str, Any],
        job_matches: List[Dict[str, Any]],
        improvements: List[Dict[str, Any]]
    ):
        self.score = score
        self.feedback = feedback
        self.extracted_info = extracted_info
        self.job_matches = job_matches
        self.improvements = improvements

async def analyze_resume_with_gemini(resume_content: str, job_description: Optional[str] = None) -> ResumeAnalysis:
    """Analyze resume content using Gemini AI."""
    
    # Prepare the prompt
    prompt = f"""
    Analyze the following resume and provide detailed feedback:
    
    RESUME:
    {resume_content}
    
    {f'JOB DESCRIPTION:\n{job_description}' if job_description else ''}
    
    Please provide a comprehensive analysis including:
    1. Overall score (0-100)
    2. Detailed feedback in categories:
       - Content Quality
       - Formatting
       - Skills & Keywords
       - Experience Descriptions
       - Education Details
       - Contact Information
       - ATS Optimization
       - Job-Specific Matching (if job description provided)
    3. Extracted information:
       - Name
       - Contact details
       - Summary
       - Experience
       - Education
       - Skills
    4. Job matches (if job description provided)
    5. Specific improvements needed
    
    Format the response as a JSON object with the following structure:
    {{
        "score": float,
        "feedback": [
            {{
                "category": str,
                "items": [
                    {{
                        "issue": str,
                        "suggestion": str,
                        "severity": "high" | "medium" | "low",
                        "fixed": bool
                    }}
                ]
            }}
        ],
        "extracted_info": {{
            "name": str,
            "contact": {{
                "email": str,
                "phone": str,
                "location": str
            }},
            "summary": str,
            "experience": [
                {{
                    "title": str,
                    "company": str,
                    "duration": str,
                    "achievements": List[str]
                }}
            ],
            "education": [
                {{
                    "degree": str,
                    "institution": str,
                    "year": str,
                    "gpa": Optional[str]
                }}
            ],
            "skills": [
                {{
                    "category": str,
                    "items": List[str]
                }}
            ]
        }},
        "job_matches": [
            {{
                "title": str,
                "company": str,
                "match_score": float,
                "description": str,
                "requirements": List[str],
                "missing_skills": List[str]
            }}
        ],
        "improvements": [
            {{
                "category": str,
                "before": str,
                "after": str,
                "explanation": str
            }}
        ]
    }}
    """

    try:
        # Generate response from Gemini
        response = await model.generate_content(prompt)
        analysis_data = json.loads(response.text)
        
        return ResumeAnalysis(
            score=analysis_data["score"],
            feedback=analysis_data["feedback"],
            extracted_info=analysis_data["extracted_info"],
            job_matches=analysis_data["job_matches"],
            improvements=analysis_data["improvements"]
        )
    except Exception as e:
        raise Exception(f"Failed to analyze resume: {str(e)}")

async def enhance_resume_with_gemini(
    resume_content: str,
    job_description: Optional[str] = None,
    feedback: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Enhance resume content using Gemini AI."""
    
    prompt = f"""
    Enhance the following resume based on the feedback and job description:
    
    RESUME:
    {resume_content}
    
    {f'JOB DESCRIPTION:\n{job_description}' if job_description else ''}
    
    {f'FEEDBACK:\n{json.dumps(feedback, indent=2)}' if feedback else ''}
    
    Please provide an enhanced version of the resume that:
    1. Addresses all feedback points
    2. Optimizes for ATS
    3. Highlights relevant skills and experience
    4. Improves formatting and readability
    5. Maintains professional tone
    
    Return only the enhanced resume content.
    """

    try:
        response = await model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Failed to enhance resume: {str(e)}")

async def generate_cover_letter_with_gemini(
    resume_content: str,
    job_description: str,
    company_info: Optional[Dict[str, Any]] = None
) -> str:
    """Generate a cover letter using Gemini AI."""
    
    prompt = f"""
    Generate a professional cover letter based on the following resume and job description:
    
    RESUME:
    {resume_content}
    
    JOB DESCRIPTION:
    {job_description}
    
    {f'COMPANY INFO:\n{json.dumps(company_info, indent=2)}' if company_info else ''}
    
    The cover letter should:
    1. Be personalized to the company and role
    2. Highlight relevant experience and skills
    3. Show enthusiasm for the position
    4. Be concise and professional
    5. Include a clear call to action
    
    Return the complete cover letter.
    """

    try:
        response = await model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Failed to generate cover letter: {str(e)}")

async def extract_linkedin_profile_with_gemini(profile_url: str) -> Dict[str, Any]:
    """Extract information from LinkedIn profile using Gemini AI."""
    
    prompt = f"""
    Extract key information from this LinkedIn profile:
    {profile_url}
    
    Please provide a structured analysis including:
    1. Professional summary
    2. Work experience
    3. Education
    4. Skills
    5. Certifications
    6. Recommendations
    
    Format the response as a JSON object.
    """

    try:
        response = await model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to extract LinkedIn profile: {str(e)}")

async def generate_learning_path_with_gemini(
    resume_content: str,
    job_description: str,
    feedback: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate a personalized learning path using Gemini AI."""
    
    prompt = f"""
    Create a personalized learning path based on the resume, job description, and feedback:
    
    RESUME:
    {resume_content}
    
    JOB DESCRIPTION:
    {job_description}
    
    FEEDBACK:
    {json.dumps(feedback, indent=2)}
    
    Please provide a structured learning path including:
    1. Required skills to develop
    2. Recommended courses and resources
    3. Timeline for skill development
    4. Practice projects
    5. Certification recommendations
    
    Format the response as a JSON object.
    """

    try:
        response = await model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to generate learning path: {str(e)}") 
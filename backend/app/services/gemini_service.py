"""
Enhanced Gemini Service
Uses existing Gemini API key and model (not Pro tier)
Implements all AI features for CVPerfect
"""

import logging
import json
import asyncio
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from ..core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Enhanced Gemini service using existing API key and model
    Implements all AI features without upgrading to Pro tier
    """
    
    def __init__(self, api_key: str = None):
        # Use existing API key from settings
        self.api_key = api_key or settings.GEMINI_API_KEY
        
        if not self.api_key or self.api_key == "your-existing-gemini-api-key":
            raise ValueError("Real Gemini API key required! Update GEMINI_API_KEY in environment.")
        
        # Configure with existing API key
        genai.configure(api_key=self.api_key)
        
        # Use existing model (not Pro)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        logger.info("GeminiService initialized with existing API key")
    
    async def analyze_resume_content(
        self, 
        resume_text: str, 
        job_description: str = None
    ) -> Dict[str, Any]:
        """
        Analyze real resume content using existing Gemini integration
        """
        try:
            if not resume_text.strip():
                raise ValueError("Resume text cannot be empty")
            
            # Create comprehensive analysis prompt
            analysis_prompt = self._create_resume_analysis_prompt(resume_text, job_description)
            
            # Generate analysis using existing Gemini model
            response = self.model.generate_content(analysis_prompt)
            analysis_text = response.text.strip()
            
            # Parse structured response
            analysis_result = self._parse_analysis_response(analysis_text)
            
            logger.info(f"Resume analysis completed: {analysis_result.get('overall_score', 0)}/100")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Resume analysis failed: {str(e)}")
            # Return fallback analysis rather than failing
            return self._get_fallback_analysis()
    
    async def generate_cover_letter(
        self, 
        resume_content: str, 
        job_description: str,
        job_title: str = None,
        company_name: str = None
    ) -> str:
        """
        Generate tailored cover letter using existing Gemini integration
        """
        try:
            cover_letter_prompt = f"""
            Generate a professional, tailored cover letter based on this resume and job posting.
            
            RESUME:
            {resume_content}
            
            JOB DESCRIPTION:
            {job_description}
            
            {f"JOB TITLE: {job_title}" if job_title else ""}
            {f"COMPANY: {company_name}" if company_name else ""}
            
            Requirements:
            - Professional, engaging tone
            - Highlight relevant experience from resume
            - Address specific job requirements
            - 3-4 paragraphs maximum
            - Include specific examples and achievements
            - Customize for the company and role
            
            Generate a complete cover letter without any placeholders.
            """
            
            response = self.model.generate_content(cover_letter_prompt)
            cover_letter = response.text.strip()
            
            logger.info("Cover letter generated successfully")
            return cover_letter
            
        except Exception as e:
            logger.error(f"Cover letter generation failed: {str(e)}")
            raise
    
    async def generate_learning_path(
        self, 
        resume_content: str, 
        job_description: str = None
    ) -> Dict[str, Any]:
        """
        Generate personalized learning path using existing Gemini integration
        """
        try:
            learning_prompt = f"""
            Create a personalized learning path based on this resume and target job requirements.
            
            CURRENT RESUME:
            {resume_content}
            
            {f"TARGET JOB: {job_description}" if job_description else ""}
            
            Provide a JSON response with this structure:
            {{
                "skill_gaps": ["skill1", "skill2", ...],
                "learning_path": [
                    {{
                        "skill": "skill_name",
                        "priority": "high|medium|low",
                        "current_level": "beginner|intermediate|advanced",
                        "target_level": "intermediate|advanced|expert",
                        "estimated_time": "time_estimate",
                        "resources": [
                            {{
                                "type": "course|book|tutorial|practice",
                                "title": "resource_title",
                                "url": "resource_url_if_available",
                                "description": "brief_description"
                            }}
                        ],
                        "milestones": ["milestone1", "milestone2", ...]
                    }}
                ],
                "career_advice": "personalized_advice",
                "next_steps": ["step1", "step2", ...]
            }}
            
            Focus on practical, actionable learning recommendations.
            """
            
            response = self.model.generate_content(learning_prompt)
            learning_text = response.text.strip()
            
            # Parse JSON response
            learning_path = self._parse_json_response(learning_text, "learning path")
            
            logger.info("Learning path generated successfully")
            return learning_path
            
        except Exception as e:
            logger.error(f"Learning path generation failed: {str(e)}")
            raise
    
    async def generate_practice_exam(
        self, 
        resume_content: str, 
        job_description: str = None,
        num_questions: int = 10
    ) -> Dict[str, Any]:
        """
        Generate practice exam questions using existing Gemini integration
        """
        try:
            exam_prompt = f"""
            Generate {num_questions} practice interview/technical questions based on this resume and job requirements.
            
            RESUME:
            {resume_content}
            
            {f"JOB REQUIREMENTS: {job_description}" if job_description else ""}
            
            Provide a JSON response with this structure:
            {{
                "exam_info": {{
                    "title": "Practice Interview Questions",
                    "description": "Tailored questions based on your resume and target role",
                    "total_questions": {num_questions},
                    "estimated_time": "estimated_time_minutes"
                }},
                "questions": [
                    {{
                        "id": 1,
                        "type": "technical|behavioral|situational",
                        "category": "category_name",
                        "question": "question_text",
                        "difficulty": "easy|medium|hard",
                        "hints": ["hint1", "hint2"],
                        "sample_answer": "sample_answer_outline",
                        "evaluation_criteria": ["criteria1", "criteria2"]
                    }}
                ]
            }}
            
            Include a mix of technical and behavioral questions relevant to the resume and role.
            """
            
            response = self.model.generate_content(exam_prompt)
            exam_text = response.text.strip()
            
            # Parse JSON response
            practice_exam = self._parse_json_response(exam_text, "practice exam")
            
            logger.info(f"Practice exam with {num_questions} questions generated")
            return practice_exam
            
        except Exception as e:
            logger.error(f"Practice exam generation failed: {str(e)}")
            raise
    
    async def analyze_job_compatibility(
        self, 
        resume_text: str, 
        job_description: str
    ) -> Dict[str, Any]:
        """
        Analyze compatibility between resume and job using existing Gemini integration
        """
        try:
            compatibility_prompt = f"""
            Analyze the compatibility between this resume and job posting.
            
            RESUME:
            {resume_text}
            
            JOB POSTING:
            {job_description}
            
            Provide a JSON response with:
            {{
                "compatibility_score": 0-100,
                "matching_skills": ["skill1", "skill2", ...],
                "missing_skills": ["missing1", "missing2", ...],
                "experience_match": "excellent|good|fair|poor",
                "key_strengths": ["strength1", "strength2", ...],
                "improvement_areas": ["area1", "area2", ...],
                "recommendation": "apply|improve_first|not_suitable",
                "detailed_feedback": "detailed_explanation"
            }}
            
            Be specific and actionable in your analysis.
            """
            
            response = self.model.generate_content(compatibility_prompt)
            compatibility_text = response.text.strip()
            
            # Parse JSON response
            compatibility_result = self._parse_json_response(compatibility_text, "job compatibility")
            
            logger.info(f"Job compatibility analyzed: {compatibility_result.get('compatibility_score', 0)}% match")
            return compatibility_result
            
        except Exception as e:
            logger.error(f"Job compatibility analysis failed: {str(e)}")
            raise
    
    async def optimize_linkedin_profile(
        self, 
        resume_content: str, 
        target_roles: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate LinkedIn optimization suggestions using existing Gemini integration
        """
        try:
            linkedin_prompt = f"""
            Provide LinkedIn profile optimization recommendations based on this resume.
            
            RESUME:
            {resume_content}
            
            {f"TARGET ROLES: {', '.join(target_roles)}" if target_roles else ""}
            
            Provide a JSON response with:
            {{
                "headline_suggestions": ["headline1", "headline2", "headline3"],
                "summary_optimization": "optimized_summary_text",
                "skills_to_add": ["skill1", "skill2", ...],
                "experience_improvements": [
                    {{
                        "section": "section_name",
                        "current": "current_description",
                        "improved": "improved_description",
                        "reasoning": "why_this_improvement"
                    }}
                ],
                "keyword_optimization": ["keyword1", "keyword2", ...],
                "content_strategy": ["strategy1", "strategy2", ...],
                "networking_advice": "networking_recommendations"
            }}
            
            Focus on SEO optimization and professional branding.
            """
            
            response = self.model.generate_content(linkedin_prompt)
            linkedin_text = response.text.strip()
            
            # Parse JSON response
            linkedin_optimization = self._parse_json_response(linkedin_text, "LinkedIn optimization")
            
            logger.info("LinkedIn optimization suggestions generated")
            return linkedin_optimization
            
        except Exception as e:
            logger.error(f"LinkedIn optimization failed: {str(e)}")
            raise
    
    def _create_resume_analysis_prompt(self, resume_text: str, job_description: str = None) -> str:
        """Create comprehensive resume analysis prompt"""
        
        base_prompt = f"""
        Analyze this resume comprehensively and provide detailed feedback.
        
        RESUME:
        {resume_text}
        
        {f"TARGET JOB: {job_description}" if job_description else ""}
        
        Provide a JSON response with this exact structure:
        {{
            "overall_score": 0-100,
            "ats_score": 0-100,
            "strengths": ["strength1", "strength2", ...],
            "feedback": [
                {{
                    "category": "technical|experience|education|format|keywords",
                    "priority": "high|medium|low",
                    "job_wants": "what_the_job_requires",
                    "you_have": "what_candidate_currently_has",
                    "fix": "specific_improvement_needed",
                    "example": "concrete_example_of_improvement",
                    "bonus": "additional_enhancement_suggestion"
                }}
            ],
            "recommendations": ["recommendation1", "recommendation2", ...],
            "keyword_analysis": {{
                "missing_keywords": ["keyword1", "keyword2", ...],
                "keyword_density": "assessment_of_current_keywords"
            }},
            "formatting_score": 0-100,
            "content_score": 0-100
        }}
        
        Be specific, actionable, and professional in your analysis.
        """
        
        return base_prompt
    
    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate analysis response"""
        try:
            # Extract JSON from response
            json_match = self._extract_json_from_text(response_text)
            
            if json_match:
                analysis = json.loads(json_match)
                
                # Validate required fields
                required_fields = ['overall_score', 'ats_score', 'strengths', 'feedback', 'recommendations']
                for field in required_fields:
                    if field not in analysis:
                        logger.warning(f"Missing field in analysis: {field}")
                        analysis[field] = [] if field in ['strengths', 'feedback', 'recommendations'] else 0
                
                # Ensure scores are in valid range
                analysis['overall_score'] = max(0, min(100, analysis.get('overall_score', 0)))
                analysis['ats_score'] = max(0, min(100, analysis.get('ats_score', 0)))
                
                return analysis
            else:
                logger.warning("No valid JSON found in analysis response")
                return self._get_fallback_analysis()
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse analysis JSON: {str(e)}")
            return self._get_fallback_analysis()
    
    def _parse_json_response(self, response_text: str, response_type: str) -> Dict[str, Any]:
        """Parse JSON response from Gemini"""
        try:
            json_match = self._extract_json_from_text(response_text)
            
            if json_match:
                return json.loads(json_match)
            else:
                logger.warning(f"No valid JSON found in {response_type} response")
                raise ValueError(f"Invalid {response_type} response format")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse {response_type} JSON: {str(e)}")
            raise ValueError(f"Invalid {response_type} response format")
    
    def _extract_json_from_text(self, text: str) -> Optional[str]:
        """Extract JSON from text that might contain markdown formatting"""
        import re
        
        # Try to find JSON wrapped in code blocks
        json_patterns = [
            r'```json\s*(.*?)\s*```',
            r'```\s*(.*?)\s*```',
            r'\{.*\}',
        ]
        
        for pattern in json_patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                json_text = match.group(1) if 'json' in pattern else match.group(0)
                try:
                    # Validate it's valid JSON
                    json.loads(json_text)
                    return json_text
                except json.JSONDecodeError:
                    continue
        
        return None
    
    def _get_fallback_analysis(self) -> Dict[str, Any]:
        """Provide fallback analysis when AI analysis fails"""
        return {
            "overall_score": 50,
            "ats_score": 45,
            "strengths": ["Resume uploaded successfully"],
            "feedback": [
                {
                    "category": "technical",
                    "priority": "medium",
                    "job_wants": "Detailed analysis",
                    "you_have": "Basic resume content",
                    "fix": "Please try uploading again or check your internet connection",
                    "example": "Ensure your resume has clear sections and readable text",
                    "bonus": "Consider using a standard resume format"
                }
            ],
            "recommendations": [
                "Try uploading your resume again",
                "Ensure your resume is in PDF or DOCX format",
                "Check that your resume has clear, readable text"
            ],
            "keyword_analysis": {
                "missing_keywords": [],
                "keyword_density": "Unable to analyze due to processing error"
            },
            "formatting_score": 50,
            "content_score": 50,
            "error": "Analysis temporarily unavailable"
        }


# Existing GeminiService instance for backward compatibility
gemini_service = GeminiService() 
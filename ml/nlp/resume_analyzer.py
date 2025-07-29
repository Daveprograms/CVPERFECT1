"""
Resume Analysis ML Service
Handles natural language processing for resume analysis, keyword extraction, and ATS scoring.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import google.generativeai as genai
from ..utils.text_processing import extract_text_from_pdf, clean_text, extract_keywords


@dataclass
class AnalysisResult:
    overall_score: float
    ats_score: float
    strengths: List[str]
    feedback: List[Dict]
    recommendations: List[str]
    keyword_density: Dict[str, float]
    readability_score: float


class ResumeAnalyzer:
    """Advanced resume analysis using Gemini AI and custom NLP algorithms."""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.logger = logging.getLogger(__name__)
    
    async def analyze_resume(
        self, 
        resume_text: str, 
        job_description: Optional[str] = None
    ) -> AnalysisResult:
        """
        Comprehensive resume analysis with AI and traditional NLP methods.
        
        Args:
            resume_text: The extracted text from the resume
            job_description: Optional job description for targeted analysis
            
        Returns:
            AnalysisResult with detailed analysis
        """
        try:
            # Clean and preprocess text
            clean_resume = clean_text(resume_text)
            
            # Perform AI analysis
            ai_analysis = await self._get_ai_analysis(clean_resume, job_description)
            
            # Calculate ATS score
            ats_score = self._calculate_ats_score(clean_resume, job_description)
            
            # Extract keywords and calculate density
            keywords = extract_keywords(clean_resume)
            keyword_density = self._calculate_keyword_density(clean_resume, keywords)
            
            # Calculate readability
            readability = self._calculate_readability(clean_resume)
            
            # Combine results
            return AnalysisResult(
                overall_score=ai_analysis.get('overall_score', 0),
                ats_score=ats_score,
                strengths=ai_analysis.get('strengths', []),
                feedback=ai_analysis.get('feedback', []),
                recommendations=ai_analysis.get('recommendations', []),
                keyword_density=keyword_density,
                readability_score=readability
            )
            
        except Exception as e:
            self.logger.error(f"Resume analysis failed: {str(e)}")
            raise
    
    async def _get_ai_analysis(
        self, 
        resume_text: str, 
        job_description: Optional[str] = None
    ) -> Dict:
        """Get AI-powered analysis using Gemini."""
        
        base_prompt = """
        Analyze this resume and provide structured feedback. Return a JSON response with:
        
        1. overall_score (0-100): Overall quality score
        2. strengths: Array of 3-5 key strengths found in the resume
        3. feedback: Array of improvement items, each with:
           - category: The area of improvement (e.g., "technical_skills", "experience")
           - emoji: Relevant emoji for the category
           - job_wants: What employers typically want
           - you_have: What the candidate currently shows
           - fix: Specific improvement action
           - example_line: Example of how to write it better
           - priority: "high", "medium", or "low"
        4. recommendations: Array of 3-5 actionable recommendations
        
        Resume text:
        {resume_text}
        """
        
        if job_description:
            base_prompt += f"""
            
            Job Description for targeted analysis:
            {job_description}
            
            Provide additional job-specific analysis focusing on how well the resume matches the job requirements.
            """
        
        try:
            response = self.model.generate_content(base_prompt.format(resume_text=resume_text))
            
            # Parse JSON response
            import json
            analysis_text = response.text.strip()
            
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in analysis_text:
                json_start = analysis_text.find("```json") + 7
                json_end = analysis_text.find("```", json_start)
                analysis_text = analysis_text[json_start:json_end].strip()
            elif "```" in analysis_text:
                json_start = analysis_text.find("```") + 3
                json_end = analysis_text.find("```", json_start)
                analysis_text = analysis_text[json_start:json_end].strip()
            
            return json.loads(analysis_text)
            
        except Exception as e:
            self.logger.error(f"AI analysis failed: {str(e)}")
            # Return fallback analysis
            return {
                "overall_score": 70,
                "strengths": ["Professional formatting", "Clear structure"],
                "feedback": [],
                "recommendations": ["Add more specific achievements", "Include relevant keywords"]
            }
    
    def _calculate_ats_score(self, resume_text: str, job_description: Optional[str] = None) -> float:
        """Calculate ATS (Applicant Tracking System) compatibility score."""
        score = 100.0
        
        # Check for ATS-unfriendly elements
        penalties = {
            'tables': len(re.findall(r'\|.*\|', resume_text)) * 5,
            'special_chars': len(re.findall(r'[^\w\s\.\,\-\(\)]', resume_text)) * 0.5,
            'short_lines': len([line for line in resume_text.split('\n') if len(line.strip()) < 10]) * 2,
            'no_keywords': 0 if job_description and self._has_job_keywords(resume_text, job_description) else 20
        }
        
        # Apply penalties
        for penalty_type, penalty_value in penalties.items():
            score -= min(penalty_value, 30)  # Cap individual penalties
        
        return max(score, 0)
    
    def _has_job_keywords(self, resume_text: str, job_description: str) -> bool:
        """Check if resume contains job-relevant keywords."""
        job_keywords = extract_keywords(job_description.lower())
        resume_keywords = extract_keywords(resume_text.lower())
        
        common_keywords = set(job_keywords) & set(resume_keywords)
        return len(common_keywords) >= min(5, len(job_keywords) * 0.3)
    
    def _calculate_keyword_density(self, text: str, keywords: List[str]) -> Dict[str, float]:
        """Calculate keyword density for top keywords."""
        text_lower = text.lower()
        word_count = len(text_lower.split())
        
        keyword_counts = {}
        for keyword in keywords[:20]:  # Top 20 keywords
            count = text_lower.count(keyword.lower())
            if count > 0:
                keyword_counts[keyword] = (count / word_count) * 100
        
        return keyword_counts
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate readability score using Flesch Reading Ease."""
        sentences = len(re.findall(r'[.!?]+', text))
        words = len(text.split())
        syllables = sum([self._count_syllables(word) for word in text.split()])
        
        if sentences == 0 or words == 0:
            return 0
        
        # Flesch Reading Ease formula
        score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
        return max(0, min(100, score))
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower().strip(".,!?;:")
        vowels = "aeiouy"
        count = 0
        prev_was_vowel = False
        
        for char in word:
            if char in vowels:
                if not prev_was_vowel:
                    count += 1
                prev_was_vowel = True
            else:
                prev_was_vowel = False
        
        # Handle silent e
        if word.endswith('e') and count > 1:
            count -= 1
        
        return max(1, count)


class ATSOptimizer:
    """Specialized class for ATS optimization recommendations."""
    
    @staticmethod
    def get_ats_recommendations(resume_text: str, job_description: str) -> List[str]:
        """Get specific ATS optimization recommendations."""
        recommendations = []
        
        # Check for standard sections
        standard_sections = ['experience', 'education', 'skills', 'summary']
        for section in standard_sections:
            if section.lower() not in resume_text.lower():
                recommendations.append(f"Add a {section.title()} section")
        
        # Check for contact information
        if not re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text):
            recommendations.append("Include a professional email address")
        
        if not re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
            recommendations.append("Include a phone number")
        
        # Check for keywords from job description
        job_keywords = extract_keywords(job_description.lower())
        resume_keywords = extract_keywords(resume_text.lower())
        missing_keywords = set(job_keywords[:10]) - set(resume_keywords)
        
        if missing_keywords:
            recommendations.append(f"Include relevant keywords: {', '.join(list(missing_keywords)[:5])}")
        
        return recommendations 
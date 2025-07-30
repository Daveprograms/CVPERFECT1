"""
Job Matching Algorithm
Matches user resumes with job postings using AI analysis
Uses existing Gemini integration (not Pro tier)
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import google.generativeai as genai
from ..utils.text_processing import extract_keywords, calculate_text_similarity, clean_text


@dataclass
class JobMatch:
    job_id: str
    job_title: str
    company: str
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]
    reasoning: str


@dataclass
class Job:
    id: str
    title: str
    company: str
    location: str
    description: str
    requirements: List[str]
    salary_range: Optional[str] = None
    posted_date: Optional[str] = None
    source: Optional[str] = None


class JobMatcher:
    """Matches resumes with job postings using existing Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')  # Using existing model
        self.logger = logging.getLogger(__name__)
    
    async def match_jobs(
        self, 
        resume_text: str, 
        jobs: List[Job], 
        max_matches: int = 10
    ) -> List[JobMatch]:
        """
        Match a resume against multiple job postings
        
        Args:
            resume_text: The candidate's resume text
            jobs: List of job postings to match against
            max_matches: Maximum number of matches to return
            
        Returns:
            List of JobMatch objects sorted by match score
        """
        try:
            matches = []
            
            for job in jobs:
                match = await self._analyze_job_match(resume_text, job)
                if match:
                    matches.append(match)
            
            # Sort by match score (highest first)
            matches.sort(key=lambda x: x.match_score, reverse=True)
            
            return matches[:max_matches]
            
        except Exception as e:
            self.logger.error(f"Job matching failed: {str(e)}")
            return []
    
    async def _analyze_job_match(
        self, 
        resume_text: str, 
        job: Job
    ) -> Optional[JobMatch]:
        """Analyze how well a resume matches a specific job"""
        
        try:
            # Use existing Gemini integration for AI analysis
            ai_analysis = await self._get_ai_match_analysis(resume_text, job)
            
            # Calculate keyword-based similarity as fallback
            keyword_similarity = self._calculate_keyword_similarity(resume_text, job.description)
            
            # Combine AI analysis with keyword matching
            final_score = self._calculate_final_score(ai_analysis, keyword_similarity)
            
            return JobMatch(
                job_id=job.id,
                job_title=job.title,
                company=job.company,
                match_score=final_score,
                matching_skills=ai_analysis.get('matching_skills', []),
                missing_skills=ai_analysis.get('missing_skills', []),
                recommendations=ai_analysis.get('recommendations', []),
                reasoning=ai_analysis.get('reasoning', '')
            )
            
        except Exception as e:
            self.logger.error(f"Failed to analyze match for job {job.id}: {str(e)}")
            return None
    
    async def _get_ai_match_analysis(
        self, 
        resume_text: str, 
        job: Job
    ) -> Dict[str, Any]:
        """Get AI-powered job match analysis using existing Gemini setup"""
        
        analysis_prompt = f"""
        Analyze how well this resume matches the job posting. Provide a detailed assessment.

        RESUME:
        {resume_text}

        JOB POSTING:
        Title: {job.title}
        Company: {job.company}
        Location: {job.location}
        Description: {job.description}
        Requirements: {', '.join(job.requirements) if job.requirements else 'Not specified'}

        Provide a JSON response with:
        {{
            "match_score": (0-100 score),
            "matching_skills": ["skill1", "skill2", ...],
            "missing_skills": ["missing1", "missing2", ...],
            "recommendations": ["recommendation1", "recommendation2", ...],
            "reasoning": "Detailed explanation of the match assessment",
            "key_strengths": ["strength1", "strength2", ...],
            "improvement_areas": ["area1", "area2", ...]
        }}
        
        Focus on:
        1. Technical skills alignment
        2. Experience level match
        3. Industry/domain fit
        4. Specific requirements coverage
        5. Career progression fit
        """
        
        try:
            response = self.model.generate_content(analysis_prompt)
            analysis_text = response.text.strip()
            
            # Parse JSON response
            import json
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
            self.logger.error(f"AI match analysis failed: {str(e)}")
            # Return fallback analysis
            return {
                "match_score": 50,
                "matching_skills": [],
                "missing_skills": [],
                "recommendations": ["Review job requirements in detail"],
                "reasoning": "Unable to perform detailed analysis",
                "key_strengths": [],
                "improvement_areas": []
            }
    
    def _calculate_keyword_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate similarity based on keyword overlap"""
        
        # Extract keywords from both texts
        resume_keywords = set(extract_keywords(clean_text(resume_text.lower()), 50))
        job_keywords = set(extract_keywords(clean_text(job_description.lower()), 50))
        
        if not resume_keywords or not job_keywords:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(resume_keywords.intersection(job_keywords))
        union = len(resume_keywords.union(job_keywords))
        
        return (intersection / union) * 100 if union > 0 else 0.0
    
    def _calculate_final_score(self, ai_analysis: Dict, keyword_similarity: float) -> float:
        """Combine AI analysis score with keyword similarity"""
        
        ai_score = ai_analysis.get('match_score', 0)
        
        # Weight AI analysis more heavily than keyword matching
        final_score = (ai_score * 0.7) + (keyword_similarity * 0.3)
        
        return min(100, max(0, final_score))
    
    def rank_candidates(
        self, 
        candidates: List[Dict[str, str]], 
        job: Job
    ) -> List[Tuple[Dict[str, str], float]]:
        """
        Rank multiple candidates for a single job
        
        Args:
            candidates: List of candidate dictionaries with resume_text
            job: Job posting to match against
            
        Returns:
            List of tuples (candidate, score) sorted by score
        """
        
        ranked_candidates = []
        
        for candidate in candidates:
            resume_text = candidate.get('resume_text', '')
            if not resume_text:
                continue
            
            # Calculate match score
            keyword_similarity = self._calculate_keyword_similarity(resume_text, job.description)
            
            ranked_candidates.append((candidate, keyword_similarity))
        
        # Sort by score (highest first)
        ranked_candidates.sort(key=lambda x: x[1], reverse=True)
        
        return ranked_candidates
    
    def get_skill_gaps(self, resume_text: str, job: Job) -> Dict[str, List[str]]:
        """Identify skill gaps between resume and job requirements"""
        
        resume_keywords = set(extract_keywords(clean_text(resume_text.lower()), 30))
        job_keywords = set(extract_keywords(clean_text(job.description.lower()), 30))
        
        # Add explicit requirements if available
        if job.requirements:
            for req in job.requirements:
                job_keywords.update(extract_keywords(clean_text(req.lower()), 10))
        
        matching_skills = list(resume_keywords.intersection(job_keywords))
        missing_skills = list(job_keywords - resume_keywords)
        
        return {
            'matching_skills': matching_skills[:10],  # Top 10
            'missing_skills': missing_skills[:10],    # Top 10
            'resume_unique_skills': list(resume_keywords - job_keywords)[:10]
        }
    
    async def get_career_recommendations(
        self, 
        resume_text: str, 
        target_jobs: List[Job]
    ) -> Dict[str, Any]:
        """Get career development recommendations based on target jobs"""
        
        try:
            # Analyze common requirements across target jobs
            all_job_text = "\n\n".join([
                f"{job.title} at {job.company}: {job.description}"
                for job in target_jobs
            ])
            
            recommendation_prompt = f"""
            Based on this resume and target job market, provide career development recommendations.

            RESUME:
            {resume_text}

            TARGET JOBS:
            {all_job_text}

            Provide JSON response with:
            {{
                "priority_skills": ["skill1", "skill2", ...],
                "learning_path": [
                    {{
                        "skill": "skill_name",
                        "urgency": "high|medium|low",
                        "resources": ["resource1", "resource2", ...],
                        "time_estimate": "estimated learning time"
                    }}
                ],
                "career_trajectory": "suggested career path",
                "immediate_actions": ["action1", "action2", ...],
                "market_trends": ["trend1", "trend2", ...]
            }}
            """
            
            response = self.model.generate_content(recommendation_prompt)
            analysis_text = response.text.strip()
            
            # Parse JSON response
            import json
            if "```json" in analysis_text:
                json_start = analysis_text.find("```json") + 7
                json_end = analysis_text.find("```", json_start)
                analysis_text = analysis_text[json_start:json_end].strip()
            
            return json.loads(analysis_text)
            
        except Exception as e:
            self.logger.error(f"Career recommendations failed: {str(e)}")
            return {
                "priority_skills": [],
                "learning_path": [],
                "career_trajectory": "Continue developing technical and soft skills",
                "immediate_actions": ["Update resume with latest projects"],
                "market_trends": []
            } 
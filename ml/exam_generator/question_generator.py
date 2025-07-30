"""
Practice Exam Question Generator
Generates custom practice questions based on resume analysis and job requirements.
"""

import json
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
import google.generativeai as genai


@dataclass
class ExamQuestion:
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    difficulty: str  # easy, medium, hard
    category: str
    topic: str


class QuestionGenerator:
    """Generate practice exam questions using AI based on resume gaps and job requirements."""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.logger = logging.getLogger(__name__)
    
    async def generate_exam(
        self,
        resume_text: str,
        job_description: Optional[str] = None,
        num_questions: int = 10,
        difficulty_mix: Dict[str, int] = None
    ) -> List[ExamQuestion]:
        """
        Generate a practice exam based on resume analysis and job requirements.
        
        Args:
            resume_text: The candidate's resume text
            job_description: Optional job description for targeted questions
            num_questions: Number of questions to generate
            difficulty_mix: Dict with 'easy', 'medium', 'hard' question counts
            
        Returns:
            List of ExamQuestion objects
        """
        if difficulty_mix is None:
            difficulty_mix = {'easy': 3, 'medium': 4, 'hard': 3}
        
        try:
            # Analyze resume to identify knowledge gaps
            gaps_analysis = await self._analyze_skill_gaps(resume_text, job_description)
            
            # Generate questions for each difficulty level
            questions = []
            question_id = 1
            
            for difficulty, count in difficulty_mix.items():
                if count > 0:
                    level_questions = await self._generate_questions_by_difficulty(
                        gaps_analysis, difficulty, count, question_id
                    )
                    questions.extend(level_questions)
                    question_id += len(level_questions)
            
            return questions[:num_questions]
            
        except Exception as e:
            self.logger.error(f"Exam generation failed: {str(e)}")
            return await self._generate_fallback_questions(num_questions)
    
    async def _analyze_skill_gaps(
        self, 
        resume_text: str, 
        job_description: Optional[str] = None
    ) -> Dict:
        """Analyze skill gaps and learning needs."""
        
        analysis_prompt = f"""
        Analyze this resume to identify key skill areas and knowledge gaps that would benefit from practice questions.
        
        Resume:
        {resume_text}
        """
        
        if job_description:
            analysis_prompt += f"""
            
            Target Job Description:
            {job_description}
            
            Focus on skills and knowledge areas mentioned in the job description that the candidate may need to strengthen.
            """
        
        analysis_prompt += """
        
        Return a JSON response with:
        {
            "primary_skills": ["skill1", "skill2", ...],
            "knowledge_gaps": ["gap1", "gap2", ...],
            "technical_areas": ["area1", "area2", ...],
            "soft_skills": ["skill1", "skill2", ...],
            "industry_knowledge": ["topic1", "topic2", ...],
            "suggested_topics": [
                {
                    "topic": "topic_name",
                    "category": "technical|behavioral|industry", 
                    "priority": "high|medium|low",
                    "reason": "why this topic is important"
                }
            ]
        }
        """
        
        try:
            response = self.model.generate_content(analysis_prompt)
            analysis_text = response.text.strip()
            
            # Extract JSON from response
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
            self.logger.error(f"Skill gap analysis failed: {str(e)}")
            return {
                "primary_skills": ["Python", "Communication", "Problem Solving"],
                "knowledge_gaps": ["Advanced algorithms", "System design"],
                "technical_areas": ["Programming", "Software Development"],
                "soft_skills": ["Leadership", "Teamwork"],
                "industry_knowledge": ["Technology trends"],
                "suggested_topics": []
            }
    
    async def _generate_questions_by_difficulty(
        self,
        gaps_analysis: Dict,
        difficulty: str,
        count: int,
        start_id: int
    ) -> List[ExamQuestion]:
        """Generate questions for a specific difficulty level."""
        
        topics = gaps_analysis.get('suggested_topics', [])
        if not topics:
            topics = [
                {"topic": skill, "category": "technical", "priority": "high"}
                for skill in gaps_analysis.get('primary_skills', [])[:count]
            ]
        
        questions = []
        
        for i, topic_info in enumerate(topics[:count]):
            topic = topic_info.get('topic', f'Topic {i+1}')
            category = topic_info.get('category', 'technical')
            
            question = await self._generate_single_question(
                topic, category, difficulty, f"q_{start_id + i}"
            )
            
            if question:
                questions.append(question)
        
        return questions
    
    async def _generate_single_question(
        self,
        topic: str,
        category: str,
        difficulty: str,
        question_id: str
    ) -> Optional[ExamQuestion]:
        """Generate a single practice question."""
        
        difficulty_guidelines = {
            'easy': 'Basic knowledge, straightforward concepts, common scenarios',
            'medium': 'Intermediate knowledge, application of concepts, some problem-solving',
            'hard': 'Advanced knowledge, complex scenarios, critical thinking required'
        }
        
        question_prompt = f"""
        Generate a multiple-choice practice question for the topic: {topic}
        
        Requirements:
        - Category: {category}
        - Difficulty: {difficulty} ({difficulty_guidelines[difficulty]})
        - 4 answer options (A, B, C, D)
        - Only one correct answer
        - Clear explanation of why the correct answer is right
        - Professional and relevant to job interviews/assessments
        
        Return JSON format:
        {{
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Detailed explanation of the correct answer",
            "topic": "{topic}"
        }}
        """
        
        try:
            response = self.model.generate_content(question_prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            question_data = json.loads(response_text)
            
            return ExamQuestion(
                id=question_id,
                question=question_data['question'],
                options=question_data['options'],
                correct_answer=question_data['correct_answer'],
                explanation=question_data['explanation'],
                difficulty=difficulty,
                category=category,
                topic=question_data.get('topic', topic)
            )
            
        except Exception as e:
            self.logger.error(f"Question generation failed for topic {topic}: {str(e)}")
            return None
    
    async def _generate_fallback_questions(self, num_questions: int) -> List[ExamQuestion]:
        """Generate fallback questions when AI generation fails."""
        fallback_questions = [
            ExamQuestion(
                id="fallback_1",
                question="What is the most important factor when writing a professional resume?",
                options=[
                    "Using fancy fonts and colors",
                    "Including every job you've ever had",
                    "Tailoring content to the specific job",
                    "Making it as long as possible"
                ],
                correct_answer=2,
                explanation="Tailoring your resume to the specific job shows you understand the role and have relevant experience.",
                difficulty="easy",
                category="resume_writing",
                topic="Resume Best Practices"
            ),
            ExamQuestion(
                id="fallback_2",
                question="Which section should typically appear first on a resume after contact information?",
                options=[
                    "References",
                    "Professional summary or objective",
                    "Education",
                    "Hobbies and interests"
                ],
                correct_answer=1,
                explanation="A professional summary or objective provides a quick overview of your qualifications and career goals.",
                difficulty="easy",
                category="resume_structure",
                topic="Resume Organization"
            ),
            ExamQuestion(
                id="fallback_3",
                question="What is ATS in the context of job applications?",
                options=[
                    "Automated Testing System",
                    "Applicant Tracking System",
                    "Advanced Technical Skills",
                    "Application Transfer Service"
                ],
                correct_answer=1,
                explanation="ATS (Applicant Tracking System) is software used by employers to manage and filter job applications.",
                difficulty="medium",
                category="job_search",
                topic="Application Process"
            )
        ]
        
        return fallback_questions[:min(num_questions, len(fallback_questions))]
    
    async def generate_targeted_questions(
        self,
        skill_area: str,
        difficulty: str,
        count: int = 5
    ) -> List[ExamQuestion]:
        """Generate questions targeted at a specific skill area."""
        questions = []
        
        for i in range(count):
            question = await self._generate_single_question(
                skill_area,
                "technical",
                difficulty,
                f"targeted_{skill_area.lower().replace(' ', '_')}_{i+1}"
            )
            
            if question:
                questions.append(question)
        
        return questions
    
    def validate_question(self, question: ExamQuestion) -> bool:
        """Validate that a question meets quality standards."""
        if not question.question or len(question.question.strip()) < 10:
            return False
        
        if len(question.options) != 4:
            return False
        
        if question.correct_answer < 0 or question.correct_answer >= 4:
            return False
        
        if not question.explanation or len(question.explanation.strip()) < 20:
            return False
        
        return True 
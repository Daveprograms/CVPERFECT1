"""
Enhanced Gemini Service — single LLM entry point for CVPerfect.

All generative calls use `settings.GEMINI_API_KEY` (via `GeminiService` or
`get_gemini_service()`). Prefer `get_gemini_service()` from routes, chat, and
workers so one lazy singleton shares configuration and the same API key.
"""

import logging
import json
import asyncio
import numbers
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from ..core.config import settings

logger = logging.getLogger(__name__)

# Forced at runtime — do not read from env, query params, or request bodies.
# Single source of truth for Gemini model selection in this service.
# NOTE: `gemini-1.5-flash` returns 404 on v1beta (retired / unsupported for generateContent).
# App standard: Gemini 2.5 Flash — see https://ai.google.dev/gemini-api/docs/models
_RUNTIME_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_GEMINI_MODEL = _RUNTIME_GEMINI_MODEL


def _format_gemini_client_error(exc: BaseException) -> str:
    """Clear, stable message for Gemini client/API failures (no stack in the string)."""
    try:
        from google.api_core import exceptions as gexc

        if isinstance(exc, gexc.ResourceExhausted):
            msg = getattr(exc, "message", None) or str(exc)
            low = msg.lower()
            # Common case: free-tier quota shows limit 0 when billing/API access isn't enabled.
            if "limit: 0" in low or "check your plan and billing" in low:
                return (
                    "Gemini quota exhausted / billing not enabled for this project. "
                    "Enable billing (or use a different Google Cloud project / API key) and retry."
                )
            return (
                "Gemini API rate limit exceeded (429). Wait before retrying — "
                "repeated calls will not help."
            )
        if isinstance(exc, gexc.PermissionDenied):
            return (
                "Gemini API permission denied — verify GEMINI_API_KEY and that the "
                "Generative Language API is enabled for the project."
            )
        if isinstance(exc, gexc.InvalidArgument):
            msg = getattr(exc, "message", None) or str(exc)
            return f"Gemini API invalid request: {msg}"
        if isinstance(exc, gexc.NotFound):
            msg = getattr(exc, "message", None) or str(exc)
            return (
                "Gemini model not found / not available for this API key. "
                f"{msg}"
            )
        if isinstance(exc, gexc.GoogleAPIError):
            return f"Gemini API error: {exc}"
    except ImportError:
        pass
    low = str(exc).lower()
    if "429" in str(exc) or "resource exhausted" in low or "quota" in low:
        return (
            "Gemini API rate limit or quota exceeded. Wait before retrying — "
            "repeated calls will not help."
        )
    return f"Gemini request failed: {exc}"

def _is_rate_limit_message(msg: str) -> bool:
    low = (msg or "").lower()
    return (
        "429" in low
        or "rate limit" in low
        or "resource exhausted" in low
        or "quota" in low
        or "too many requests" in low
    )


# Must not use an f-string: resume/job text may contain `{...}` and would be
# interpreted as Python interpolation (e.g. NameError for `{gemini_service}`).
_COVER_LETTER_INSTRUCTIONS_TAIL = """
INTELLIGENCE RULES:

1. The RESUME TEXT above is authoritative for the candidate's background.
   - Ground every major claim in skills, roles, or outcomes that appear in that resume (paraphrase; do not copy verbatim).
   - Do NOT invent employers, degrees, certifications, or metrics that contradict or are absent from the resume.
   - Do NOT say "based on your resume" or similar meta-phrases.

2. Extract the COMPANY NAME and ROLE TITLE from the job description.
   - Do NOT ask the reader for these; they are not in the chat.
   - If unclear, infer the most likely company and role from context (posting language, "About us", team name, product, or location clues).

STRUCTURE (MANDATORY — complete the FULL letter in one response):

- Paragraph 1: Strong opening that names the company and role naturally.
- Paragraphs 2–4: Connect resume-backed achievements and skills to specific themes in the job description (impact, scope, tools, leadership as appropriate). NO bullet points.
- Final paragraph: Polite, confident closing that thanks the reader and signals availability for a conversation — must be a finished paragraph (do not stop mid-sentence).

LENGTH AND COMPLETENESS:
- Write a complete professional cover letter of roughly 400–650 words unless the resume is very short.
- You MUST output the entire letter from salutation through closing in this single reply (no "to be continued", no truncation, no placeholders).

STYLE RULES:
- Professional, natural, and human (not robotic).
- Avoid clichés like "I am writing to apply".
- No generic motivational filler.
- No bullet points.

STRICT:
- Do NOT output explanations, JSON, or metadata.
- Do NOT output labels or headings (e.g. no "Cover Letter" title).
- Output ONLY the final cover letter text (plain paragraphs).
- Do NOT wrap the output in markdown code fences.
""".lstrip()


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

        self._ensure_genai_configured()
        self._model_name = _RUNTIME_GEMINI_MODEL
        self.model = genai.GenerativeModel(self._model_name)

        logger.info(
            "GeminiService initialized (forced runtime model=%r)",
            self._model_name,
        )

    def _ensure_genai_configured(self) -> None:
        """Apply API key before any generate_content call (safe to call repeatedly)."""
        genai.configure(api_key=self.api_key)

    def _configure_and_generate(self, *args: Any, **kwargs: Any) -> Any:
        self._ensure_genai_configured()
        logger.info(
            "[gemini] generate_content call using model=%r",
            self._model_name,
        )
        try:
            return self.model.generate_content(*args, **kwargs)
        except Exception as e:
            logger.exception("Gemini generate_content failed")
            raise ValueError(_format_gemini_client_error(e)) from e

    @staticmethod
    def _generate_content_response_text(response: Any) -> str:
        """
        Build full model output text. With response_mime_type=application/json,
        `response.text` is sometimes empty; read candidate parts instead.
        """
        try:
            t = (getattr(response, "text", None) or "").strip()
            if t:
                return t
        except Exception:
            pass
        chunks: List[str] = []
        for cand in getattr(response, "candidates", None) or []:
            content = getattr(cand, "content", None)
            parts = getattr(content, "parts", None) if content else None
            if not parts:
                continue
            for part in parts:
                txt = getattr(part, "text", None)
                if txt:
                    chunks.append(txt)
        return "".join(chunks).strip()

    @staticmethod
    def _strip_outer_code_fences(text: str) -> str:
        """Remove a single outer ```...``` wrapper if the model ignored 'no fences'."""
        s = (text or "").strip()
        if not s.startswith("```"):
            return s
        lines = s.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        while lines and lines[-1].strip() == "```":
            lines.pop()
        return "\n".join(lines).strip()

    @staticmethod
    def _log_gemini_response_meta(response: Any) -> None:
        pf = getattr(response, "prompt_feedback", None)
        if pf is not None:
            logger.info("[gemini] prompt_feedback=%r", pf)
        for i, cand in enumerate(getattr(response, "candidates", None) or []):
            fr = getattr(cand, "finish_reason", None)
            logger.info("[gemini] candidate[%s] finish_reason=%r", i, fr)

    @staticmethod
    def _gemini_output_truncated(response: Any) -> bool:
        """True if generation stopped for output length (caller must not treat text as complete)."""
        for cand in getattr(response, "candidates", None) or []:
            fr = getattr(cand, "finish_reason", None)
            if fr is None:
                continue
            name = getattr(fr, "name", "") or ""
            if isinstance(name, str) and "MAX_TOKEN" in name.upper():
                return True
            try:
                if int(getattr(fr, "value", fr)) == 2:
                    return True
            except (TypeError, ValueError):
                pass
            fr_str = str(fr).upper()
            if "MAX_TOKENS" in fr_str or "MAX_OUTPUT_TOKENS" in fr_str:
                return True
        return False

    async def analyze_resume_content(
        self,
        resume_text: str,
        job_description: str = None,
    ) -> Dict[str, Any]:
        """
        Analyze real resume content using Gemini. On parse failure or API errors,
        raises (no silent generic fallback — callers handle HTTP errors).
        """
        stripped = resume_text.strip()
        if not stripped:
            raise ValueError("Resume text cannot be empty")

        preview = stripped[:500].replace("\n", "\\n")
        logger.info(
            "[gemini_resume_input_preview] chars=%s first_500_chars=%r",
            len(stripped),
            preview,
        )
        logger.debug(
            "[gemini_resume_full_text] char_count=%s body=%r",
            len(stripped),
            stripped,
        )

        analysis_prompt = self._create_resume_analysis_prompt(
            stripped, job_description
        )

        def _call_gemini():
            return self._configure_and_generate(
                analysis_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                ),
            )

        # Gemini rate limit handling (429): do NOT retry immediately.
        # Exponential backoff: ~2s, ~5s, ~10s. Max 3 retries.
        retry_delays_s = (2, 5, 10)
        attempt = 0
        while True:
            try:
                response = await asyncio.to_thread(_call_gemini)
                break
            except ValueError as e:
                msg = str(e)
                if _is_rate_limit_message(msg) and attempt < len(retry_delays_s):
                    delay = retry_delays_s[attempt]
                    logger.warning(
                        "[gemini_rate_limit] resume_analysis attempt=%s/%s waiting=%ss msg=%r",
                        attempt + 1,
                        len(retry_delays_s),
                        delay,
                        msg,
                    )
                    attempt += 1
                    await asyncio.sleep(delay)
                    continue
                if _is_rate_limit_message(msg):
                    logger.error(
                        "[gemini_rate_limit] resume_analysis exhausted_retries attempts=%s msg=%r",
                        attempt,
                        msg,
                    )
                    raise ValueError(
                        "AI analysis temporarily unavailable. Please try again shortly."
                    ) from e
                raise
            except Exception as e:
                logger.exception("Resume analysis Gemini request failed")
                raise ValueError(_format_gemini_client_error(e)) from e

        self._log_gemini_response_meta(response)
        analysis_text = self._generate_content_response_text(response)
        logger.info(
            "[gemini] raw Gemini response before parsing (char_count=%s, preview_2000)=%r",
            len(analysis_text),
            (analysis_text[:2000] if analysis_text else ""),
        )
        logger.info(
            "[gemini_resume_raw_response_before_parse] char_count=%s text=%r",
            len(analysis_text),
            analysis_text[:12000],
        )
        if not analysis_text:
            raise ValueError(
                "Empty Gemini response (no text in response.text or candidate parts). "
                "See logs for prompt_feedback and finish_reason."
            )
        analysis_result = self._parse_analysis_response(analysis_text)

        logger.info(
            "[gemini_resume_parsed_result] %s",
            json.dumps(analysis_result, default=str)[:12000],
        )
        logger.info(
            "Resume analysis completed: score=%s/100 ats=%s/100",
            analysis_result.get("overall_score"),
            analysis_result.get("ats_score"),
        )
        return analysis_result

    async def enhance_resume_with_gemini(
        self,
        resume_text: str,
        job_description: Optional[str] = None,
        feedback_context: Any = None,
    ) -> str:
        """
        Full-resume rewrite for clarity / impact / ATS alignment.
        Caller persists the result (e.g. ResumeVersion); does not mutate ORM here.
        """
        stripped = (resume_text or "").strip()
        if not stripped:
            raise ValueError("Resume text cannot be empty")

        jd = (job_description or "").strip()
        fb_json = ""
        if feedback_context is not None:
            try:
                fb_json = json.dumps(feedback_context, ensure_ascii=False)[:8000]
            except (TypeError, ValueError):
                fb_json = str(feedback_context)[:8000]

        prompt = f"""You are an expert resume editor. Rewrite the resume below for stronger impact, clarity, and ATS alignment.

{"TARGET ROLE / JOB CONTEXT:\n" + jd + "\n" if jd else ""}
{"PRIOR FEEDBACK / ANALYSIS TO ADDRESS (JSON or notes):\n" + fb_json + "\n" if fb_json else ""}

RULES:
- Preserve factual claims (employers, titles, dates, education). Do not invent roles, degrees, or metrics.
- Tighten wording; use strong action verbs; keep a professional tone.
- Prefer concise bullets for experience where appropriate.
- Return ONLY the improved resume body text (no markdown code fences, no preamble or postscript).

RESUME:
{stripped}
"""

        def _call():
            return self._configure_and_generate(prompt)

        out = await asyncio.to_thread(_call)
        text = self._generate_content_response_text(out)
        if not (text or "").strip():
            raise ValueError("Gemini returned empty enhanced resume text")
        return text.strip()
    
    async def generate_cover_letter(
        self,
        resume_content: str,
        job_description: str,
    ) -> str:
        """
        Full professional cover letter grounded in ``resume_content`` (caller validates non-empty).
        Company and role are inferred from the job description.
        """
        resume_stripped = (resume_content or "").strip()
        if not resume_stripped:
            raise ValueError("Resume text is required to generate a cover letter.")
        jd = (job_description or "").strip()
        if not jd:
            raise ValueError("Job description is required.")

        cover_letter_prompt = (
            "You are an expert cover letter writer.\n\n"
            "Generate ONE complete, tailored cover letter for this candidate.\n\n"
            "RESUME TEXT (use as the only source of truth for the candidate's background):\n"
            + resume_stripped
            + "\n\nJOB DESCRIPTION (infer company and role from this text):\n"
            + jd
            + "\n\n"
            + _COVER_LETTER_INSTRUCTIONS_TAIL
        )

        def _call():
            return self._configure_and_generate(
                cover_letter_prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=8192,
                    temperature=0.65,
                ),
            )

        try:
            response = await asyncio.to_thread(_call)
        except Exception as e:
            logger.error("Cover letter generation failed: %s", e)
            raise

        self._log_gemini_response_meta(response)
        if not getattr(response, "candidates", None):
            raise ValueError(
                "AI returned no usable output (empty or blocked). "
                "Try again, or shorten the pasted job description if it is extremely long."
            )

        cover_letter = self._generate_content_response_text(response).strip()
        if not cover_letter:
            try:
                cover_letter = (getattr(response, "text", None) or "").strip()
            except Exception:
                cover_letter = ""
        if not cover_letter:
            raise ValueError("Empty cover letter from model")

        if self._gemini_output_truncated(response):
            raise ValueError(
                "The model hit its output limit and the letter may be incomplete. "
                "Shorten the pasted job description or resume excerpt and try again."
            )

        cover_letter = self._strip_outer_code_fences(cover_letter)

        logger.info("Cover letter generated successfully (%s chars)", len(cover_letter))
        return cover_letter
    
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
            
            response = self._configure_and_generate(learning_prompt)
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
            
            response = self._configure_and_generate(exam_prompt)
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
            
            response = self._configure_and_generate(compatibility_prompt)
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
            
            response = self._configure_and_generate(linkedin_prompt)
            linkedin_text = response.text.strip()
            
            # Parse JSON response
            linkedin_optimization = self._parse_json_response(linkedin_text, "LinkedIn optimization")
            
            logger.info("LinkedIn optimization suggestions generated")
            return linkedin_optimization
            
        except Exception as e:
            logger.error(f"LinkedIn optimization failed: {str(e)}")
            raise
    
    async def match_resume_to_job(
        self,
        resume_content: str,
        job_description: str,
        job_title: str = None,
        company_name: str = None
    ) -> Dict[str, Any]:
        """
        Match resume to job description and provide detailed analysis
        Returns match score and recommendations
        """
        try:
            match_prompt = f"""
            Analyze how well this resume matches the job requirements and provide a detailed assessment.
            
            RESUME:
            {resume_content}
            
            JOB DESCRIPTION:
            {job_description}
            
            {f"JOB TITLE: {job_title}" if job_title else ""}
            {f"COMPANY: {company_name}" if company_name else ""}
            
            Provide a JSON response with this structure:
            {{
                "match_score": 0-100,
                "strengths": ["strength1", "strength2", ...],
                "gaps": ["gap1", "gap2", ...],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "overall_assessment": "detailed_assessment_paragraph",
                "key_skills_matched": ["skill1", "skill2", ...],
                "missing_skills": ["skill1", "skill2", ...]
            }}
            
            Be specific and actionable in your analysis.
            The match_score should reflect how well the candidate's experience and skills align with the job requirements.
            """
            
            response = self._configure_and_generate(match_prompt)
            match_text = response.text.strip()
            
            # Parse JSON response
            match_result = self._parse_json_response(match_text, "job match")
            
            # Import here to avoid circular dependency
            from ..schemas.job import JobMatchResponse
            
            # Validate and return as JobMatchResponse
            return JobMatchResponse(**match_result)
            
        except Exception as e:
            logger.error(f"Job matching failed: {str(e)}")
            raise
    
    async def generate_interview_questions(
        self,
        job_title: str,
        company_name: str = None,
        resume_content: str = None,
        question_type: str = None,
        difficulty: str = "medium",
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate tailored interview questions
        """
        try:
            questions_prompt = f"""
            Generate {count} interview questions for a {job_title} position.
            
            {f"COMPANY: {company_name}" if company_name else ""}
            {f"CANDIDATE RESUME: {resume_content[:1000]}" if resume_content else ""}
            {f"QUESTION TYPE: {question_type}" if question_type else "Mix of technical and behavioral"}
            DIFFICULTY: {difficulty}
            
            Provide a JSON response with this structure:
            {{
                "questions": [
                    {{
                        "question_text": "question",
                        "question_type": "technical|behavioral|situational|system_design|coding",
                        "difficulty": "easy|medium|hard",
                        "category": "category_name",
                        "hints": ["hint1", "hint2"],
                        "sample_answer": "example_answer_outline"
                    }}
                ]
            }}
            
            Make questions specific, relevant, and challenging.
            """
            
            response = self._configure_and_generate(questions_prompt)
            questions_text = response.text.strip()
            
            result = self._parse_json_response(questions_text, "interview questions")
            
            logger.info(f"Generated {len(result.get('questions', []))} interview questions")
            return result.get('questions', [])
            
        except Exception as e:
            logger.error(f"Question generation failed: {str(e)}")
            raise
    
    async def evaluate_interview_answer(
        self,
        question: str,
        answer: str,
        question_type: str,
        job_title: str = None
    ) -> Dict[str, Any]:
        """
        Evaluate an interview answer and provide feedback
        """
        try:
            evaluation_prompt = f"""
            Evaluate this interview answer and provide detailed feedback.
            
            QUESTION: {question}
            QUESTION TYPE: {question_type}
            {f"JOB ROLE: {job_title}" if job_title else ""}
            
            CANDIDATE'S ANSWER:
            {answer}
            
            Provide a JSON response with:
            {{
                "score": 0-100,
                "strengths": ["strength1", "strength2"],
                "improvements": ["improvement1", "improvement2"],
                "detailed_feedback": "comprehensive_feedback_paragraph",
                "suggested_answer": "better_answer_example"
            }}
            
            Be constructive, specific, and actionable in your feedback.
            """
            
            response = self._configure_and_generate(evaluation_prompt)
            evaluation_text = response.text.strip()
            
            result = self._parse_json_response(evaluation_text, "answer evaluation")
            
            logger.info(f"Evaluated answer with score: {result.get('score', 0)}")
            return result
            
        except Exception as e:
            logger.error(f"Answer evaluation failed: {str(e)}")
            raise
    
    async def generate_interview_tips(
        self,
        job_role: str,
        company_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate interview tips for a specific role
        """
        try:
            tips_prompt = f"""
            Provide comprehensive interview tips for a {job_role} position.
            {f"COMPANY: {company_name}" if company_name else ""}
            
            Provide a JSON response with:
            {{
                "general_tips": ["tip1", "tip2", ...],
                "technical_tips": ["tip1", "tip2", ...],
                "behavioral_tips": ["tip1", "tip2", ...],
                "common_questions": ["question1", "question2", ...],
                "preparation_checklist": ["item1", "item2", ...]
            }}
            
            Be practical and specific to the role.
            """
            
            response = self._configure_and_generate(tips_prompt)
            tips_text = response.text.strip()
            
            result = self._parse_json_response(tips_text, "interview tips")
            
            logger.info(f"Generated interview tips for {job_role}")
            return result
            
        except Exception as e:
            logger.error(f"Tips generation failed: {str(e)}")
            raise
    
    async def generate_company_prep(
        self,
        company_name: str,
        job_role: str = None
    ) -> Dict[str, Any]:
        """
        Generate company-specific interview preparation
        """
        try:
            company_prompt = f"""
            Provide company-specific interview preparation for {company_name}.
            {f"POSITION: {job_role}" if job_role else ""}
            
            Provide a JSON response with:
            {{
                "company_overview": "brief_overview",
                "culture_insights": ["insight1", "insight2", ...],
                "interview_process": ["step1", "step2", ...],
                "common_questions": ["question1", "question2", ...],
                "tips": ["tip1", "tip2", ...],
                "resources": [
                    {{
                        "title": "resource_title",
                        "url": "url_if_available",
                        "description": "description"
                    }}
                ]
            }}
            
            Focus on publicly available information and general insights.
            """
            
            response = self._configure_and_generate(company_prompt)
            company_text = response.text.strip()
            
            result = self._parse_json_response(company_text, "company preparation")
            
            logger.info(f"Generated company prep for {company_name}")
            return result
            
        except Exception as e:
            logger.error(f"Company prep generation failed: {str(e)}")
            raise
    
    def _create_resume_analysis_prompt(self, resume_text: str, job_description: str = None) -> str:
        """
        Resume + job text are concatenated (not f-interpolated) so braces in user
        content cannot break the prompt string.
        """
        jd = (job_description or "").strip()
        job_section = ""
        if jd:
            job_section = (
                "\n\n=== TARGET JOB POSTING (fit + keyword alignment ONLY; "
                "every factual claim about the candidate must still come from the resume) ===\n"
                + jd
                + "\n"
            )

        instructions = """
You are an elite resume strategist, ATS optimization expert, and hiring manager.

Your job is to analyze and improve a candidate’s resume based on a given job description.

You must ALWAYS return structured, complete, and useful outputs.

=== INPUTS YOU RECEIVE ===
1) Resume text
2) Job description (optional but usually present; if present, treat it as the target)

=== CRITICAL RULES (NON-NEGOTIABLE) ===
1) Grounding: You MUST analyze ONLY the provided resume content. Do NOT invent employers, degrees, certifications, metrics, dates, or tools.
2) Precision: Do NOT give generic advice. Every weakness/fix must reference something real in the resume OR a concrete requirement in the job description.
3) "job_wants" is NEVER empty when a job description is provided:
   - Extract exact requirements from the job description (skills, tools, YOE, domains, deliverables, metrics, leadership scope).
4) "user_has" must reflect the actual resume:
   - Compare directly against job_wants and be honest: missing / partial / strong match.
5) "fix" must be actionable and demonstrate improved wording:
   - When a bullet needs rewriting, include a rewritten version (not just advice).
6) ATS optimization is mandatory:
   - Inject relevant keywords naturally (no stuffing), match job language, keep formatting parsable, and emphasize measurable achievements.
7) Output completeness:
   - Provide a fully rewritten ATS-optimized resume tailored to the job.
   - Provide a personalized cover letter tailored to the company/role.

=== SCORING (0–100) — TWO DISTINCT SCORES ===
- "score": Human hire signal (impact, credibility, scope, clarity, progression). Calibrate fairly to the candidate’s implied seniority.
- "ats_score": ATS match + parseability + keyword alignment to the job description.
Target: the optimized resume should reasonably push ats_score toward 90–100 when feasible without inventing facts.

=== OUTPUT FORMAT (STRICT JSON ONLY) ===
Return one JSON object with EXACTLY these keys (no markdown, no code fences, no extra commentary outside JSON):

{
  "score": number,
  "ats_score": number,
  "strengths": [
    { "title": string, "description": string }
  ],
  "weaknesses": [
    {
      "category": "experience | formatting | ats | technical",
      "job_wants": string,
      "user_has": string,
      "fix": string,
      "impact": "low | medium | high"
    }
  ],
  "suggestions": [string],
  "improvements": [string],
  "optimized_resume": string,
  "cover_letter": string
}

=== QUALITY BAR ===
- strengths: 3–6 items, concrete and evidence-based.
- weaknesses: 5–10 items, each tied to (a) a JD requirement and (b) the current resume evidence (or lack of it).
- suggestions: 5–10 highest-impact actions, prioritized.
- improvements: 5–12 micro-edits and rewrite patterns; include examples.
- optimized_resume: clean, ATS-friendly, fully rewritten, tailored to the JD, with strong action+impact bullets.
- cover_letter: human, confident, specific to the company/role; grounded in resume evidence; no clichés.

=== RESUME TEXT ===
"""

        body = (resume_text or "").strip()
        return instructions.strip() + "\n\n" + body + job_section

    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini JSON; on failure log raw response and raise (no fallback)."""
        raw = (response_text or "").strip()
        if not raw:
            logger.error("[resume_analysis_parse] empty model response")
            raise ValueError("Empty model response")

        json_match = self._extract_json_from_text(raw)
        if not json_match:
            logger.error(
                "[resume_analysis_parse] no JSON extracted; raw_len=%s raw=%r",
                len(raw),
                raw[:12000],
            )
            raise ValueError("Model response did not contain valid JSON")

        try:
            analysis = json.loads(json_match)
        except json.JSONDecodeError as e:
            logger.error(
                "[resume_analysis_parse] JSONDecodeError: %s raw=%r",
                e,
                raw[:12000],
            )
            raise ValueError("Invalid JSON in model response") from e

        if not isinstance(analysis, dict):
            logger.error(
                "[resume_analysis_parse] root not object; raw=%r", raw[:12000]
            )
            raise ValueError("JSON root must be an object")

        score_val = analysis.get("score")
        if score_val is None:
            score_val = analysis.get("overall_score")
        if score_val is None:
            logger.error(
                "[resume_analysis_parse] missing score; keys=%s raw=%r",
                list(analysis.keys()),
                raw[:12000],
            )
            raise ValueError("Missing required field: score or overall_score")

        if isinstance(score_val, bool) or not isinstance(score_val, numbers.Real):
            logger.error(
                "[resume_analysis_parse] score not a JSON number type=%s raw=%r",
                type(score_val).__name__,
                raw[:12000],
            )
            raise ValueError(
                f"score must be a JSON number, got {type(score_val).__name__}"
            )

        overall_score = float(score_val)

        ats_val = analysis.get("ats_score")
        if ats_val is None:
            logger.error(
                "[resume_analysis_parse] missing ats_score; raw=%r", raw[:12000]
            )
            raise ValueError("Missing required field: ats_score")
        if isinstance(ats_val, bool) or not isinstance(ats_val, numbers.Real):
            logger.error(
                "[resume_analysis_parse] ats_score not a JSON number type=%s raw=%r",
                type(ats_val).__name__,
                raw[:12000],
            )
            raise ValueError(
                f"ats_score must be a JSON number, got {type(ats_val).__name__}"
            )

        ats_score = float(ats_val)

        strengths = analysis.get("strengths")
        if not isinstance(strengths, list):
            strengths = []
        weaknesses = analysis.get("weaknesses")
        if not isinstance(weaknesses, list):
            weaknesses = []
        suggestions = analysis.get("suggestions")
        if not isinstance(suggestions, list):
            suggestions = []
        improvements = analysis.get("improvements")
        if not isinstance(improvements, list):
            improvements = []
        optimized_resume = analysis.get("optimized_resume")
        cover_letter = analysis.get("cover_letter")
        if not isinstance(optimized_resume, str):
            optimized_resume = ""
        if not isinstance(cover_letter, str):
            cover_letter = ""

        overall_score = max(0.0, min(100.0, overall_score))
        ats_score = max(0.0, min(100.0, ats_score))

        rec_strings: List[str] = []
        for s in suggestions:
            if isinstance(s, str) and s.strip():
                rec_strings.append(s.strip())
        for imp in improvements:
            if isinstance(imp, str) and imp.strip():
                rec_strings.append(imp.strip())
            elif isinstance(imp, dict):
                t = imp.get("explanation") or imp.get("text") or imp.get("suggestion")
                if t and str(t).strip():
                    rec_strings.append(str(t).strip())

        return {
            "score": overall_score,
            "overall_score": overall_score,
            "ats_score": ats_score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "feedback": weaknesses,
            "suggestions": [s for s in suggestions if isinstance(s, str) and s.strip()],
            "improvements": improvements,
            "recommendations": rec_strings,
            "optimized_resume": optimized_resume.strip(),
            "cover_letter": cover_letter.strip(),
            "data_source": "gemini",
        }
    
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
        """Extract a single JSON object from model output (fences or balanced braces)."""
        import re

        t = text.strip()

        for pattern in (r"```json\s*(.*?)\s*```", r"```\s*(.*?)\s*```"):
            match = re.search(pattern, t, re.DOTALL | re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                try:
                    json.loads(candidate)
                    return candidate
                except json.JSONDecodeError:
                    continue

        start = t.find("{")
        if start >= 0:
            depth = 0
            in_str = False
            esc = False
            quote = ""
            for i in range(start, len(t)):
                c = t[i]
                if in_str:
                    if esc:
                        esc = False
                    elif c == "\\":
                        esc = True
                    elif c == quote:
                        in_str = False
                else:
                    if c in "\"'":
                        in_str = True
                        quote = c
                    elif c == "{":
                        depth += 1
                    elif c == "}":
                        depth -= 1
                        if depth == 0:
                            candidate = t[start : i + 1]
                            try:
                                json.loads(candidate)
                                return candidate
                            except json.JSONDecodeError:
                                break

        try:
            json.loads(t)
            return t
        except json.JSONDecodeError:
            return None

    async def generate_text(self, prompt: str) -> str:
        """
        Generic text generation — used by the chat router and other
        features that need a simple prompt → response interface.
        """
        try:
            response = self._configure_and_generate(prompt)
            return response.text.strip()
        except ValueError:
            raise
        except Exception as e:
            logger.error("generate_text failed: %s", e)
            raise ValueError(_format_gemini_client_error(e)) from e


def verify_gemini_api_key(api_key: Optional[str] = None) -> tuple:
    """
    Single minimal request to confirm GEMINI_API_KEY works. No retries.
    Returns (True, "") on success, (False, reason) on failure.
    """
    key = (api_key if api_key is not None else settings.GEMINI_API_KEY) or ""
    key = str(key).strip()
    if not key or key == "your-existing-gemini-api-key":
        return False, "GEMINI_API_KEY is missing or set to a placeholder."
    try:
        genai.configure(api_key=key)
        logger.info(
            "[gemini] verify_gemini_api_key probe using model=%r",
            _RUNTIME_GEMINI_MODEL,
        )
        model = genai.GenerativeModel(_RUNTIME_GEMINI_MODEL)
        resp = model.generate_content(
            "Reply with exactly the single word: OK",
            generation_config=genai.GenerationConfig(max_output_tokens=32),
        )
        text = GeminiService._generate_content_response_text(resp)
        if not (text or "").strip():
            return (
                False,
                "Gemini returned an empty response during API key verification.",
            )
        return True, ""
    except Exception as e:
        logger.warning("verify_gemini_api_key failed: %s", e, exc_info=True)
        return False, _format_gemini_client_error(e)


_singleton: Optional[GeminiService] = None

def get_gemini_service() -> GeminiService:
    """
    Lazy singleton accessor.
    Prevents import-time crashes when GEMINI_API_KEY/model are misconfigured.
    Routes can catch errors and return a clean 503 instead.
    """
    global _singleton
    if _singleton is None:
        _singleton = GeminiService()
    return _singleton


class _LegacyGeminiModuleHandle:
    """Lazy delegate for legacy `from ..gemini_service import gemini_service` imports."""

    __slots__ = ()

    def __getattr__(self, item: str):
        return getattr(get_gemini_service(), item)


gemini_service = _LegacyGeminiModuleHandle()

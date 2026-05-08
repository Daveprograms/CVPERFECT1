"""
AI runner (strict JSON + schema validation + audit).

This is the production-grade entrypoint that every AI feature should use.
It persists an `ai_runs` row and enforces JSON-only output for structured calls.

Design spec: docs/architecture/05_ai_pipeline.md
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from ..models.ai_run import AIRun, AIRunKind, AIRunStatus
from .gemini_service import get_gemini_service

T = TypeVar("T", bound=BaseModel)


class AIInvalidResponseError(RuntimeError):
    pass


@dataclass(frozen=True)
class AIRunContext:
    resume_id: Optional[UUID] = None
    resume_variant_id: Optional[UUID] = None
    job_description_id: Optional[UUID] = None
    background_job_id: Optional[UUID] = None


def _hash_prompt(prompt: str) -> str:
    h = hashlib.sha256()
    h.update((prompt or "").encode("utf-8"))
    return h.hexdigest()


class AIRunner:
    """
    Minimal implementation to establish the contract.

    Note: token/cost extraction is provider-specific and will be added when we
    wire in provider metadata.
    """

    def call_json(
        self,
        *,
        db: Session,
        user_id: UUID,
        kind: AIRunKind,
        schema: Type[T],
        prompt: str,
        provider: str = "gemini",
        model: str = "gemini-2.5-flash",
        context: AIRunContext = AIRunContext(),
        max_attempts: int = 2,
    ) -> T:
        if max_attempts < 1:
            raise ValueError("max_attempts must be >= 1")

        prompt_hash = _hash_prompt(prompt)

        run = AIRun(
            user_id=user_id,
            kind=kind,
            status=AIRunStatus.RUNNING,
            provider=provider,
            model=model,
            prompt_hash=prompt_hash,
            resume_id=context.resume_id,
            resume_variant_id=context.resume_variant_id,
            job_description_id=context.job_description_id,
            background_job_id=context.background_job_id,
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        start = time.perf_counter()
        last_err: Optional[str] = None

        for attempt in range(1, max_attempts + 1):
            try:
                # NOTE: We rely on Gemini JSON-mode by forcing response_mime_type.
                # The existing GeminiService already knows how to recover the full
                # response text from candidate parts.
                response = get_gemini_service()._configure_and_generate(
                    prompt,
                    generation_config={
                        "temperature": 0.3,
                        "response_mime_type": "application/json",
                    },
                )
                text = get_gemini_service()._generate_content_response_text(response)
                raw = json.loads(text)
                parsed = schema.model_validate(raw)

                run.status = AIRunStatus.SUCCEEDED
                run.latency_ms = int((time.perf_counter() - start) * 1000)
                run.response_payload = parsed.model_dump(mode="json")
                db.commit()
                return parsed

            except (json.JSONDecodeError, ValidationError) as e:
                last_err = f"{type(e).__name__}: {str(e)[:800]}"
                if attempt >= max_attempts:
                    break
                # Repair attempt: ask the model to output valid JSON matching schema.
                repair_prompt = (
                    "You returned invalid JSON for the requested schema.\n\n"
                    f"Validation error:\n{last_err}\n\n"
                    "Return ONLY valid JSON. No code fences. No commentary.\n\n"
                    f"Original task:\n{prompt}"
                )
                prompt = repair_prompt
                continue

            except Exception as e:  # provider/network/transient errors
                last_err = f"{type(e).__name__}: {str(e)[:800]}"
                break

        run.status = AIRunStatus.FAILED
        run.latency_ms = int((time.perf_counter() - start) * 1000)
        run.error_message = last_err
        db.commit()

        raise AIInvalidResponseError(last_err or "AI call failed")


_singleton: Optional[AIRunner] = None


def get_ai_runner() -> AIRunner:
    global _singleton
    if _singleton is None:
        _singleton = AIRunner()
    return _singleton


"""Tests for resume analysis JSON shaping helpers."""

from __future__ import annotations

import uuid
from types import SimpleNamespace

from app.utils.resume_analysis_format import (
    build_analysis_api_dict,
    ensure_json_serializable,
)


class _Obj:
    def __str__(self) -> str:
        return "weird"


def test_ensure_json_serializable_coerces_nested_weird_types() -> None:
    raw = {"x": 1, "y": {"z": _Obj()}}
    out = ensure_json_serializable(raw)
    assert out == {"x": 1, "y": {"z": "weird"}}


def test_build_analysis_api_dict_accepts_string_created_at() -> None:
    """Some drivers / legacy rows may surface created_at as str — must not crash."""
    rid = uuid.uuid4()
    aid = uuid.uuid4()
    resume = SimpleNamespace(id=rid, filename="cv.pdf", content="x" * 60)
    analysis = SimpleNamespace(
        id=aid,
        created_at="2024-01-15T12:34:56+00:00",
        overall_score=82.0,
        ats_score=71.0,
        strengths=[{"title": "T", "description": "D"}],
        recommendations=["do thing"],
        analysis_data={"weaknesses": [], "suggestions": [], "data_source": "gemini"},
    )
    payload = build_analysis_api_dict(resume, analysis)  # type: ignore[arg-type]
    assert payload["created_at"] == "2024-01-15T12:34:56+00:00"
    assert payload["score"] == 82.0
    assert payload["ats_score"] == 71.0

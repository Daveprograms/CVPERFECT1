"""
Normalize stored Gemini / fallback analysis into the JSON shape expected by the Next.js UI.
"""
from __future__ import annotations

import json
import logging
import math
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from ..models.resume import Resume, ResumeAnalysis

logger = logging.getLogger(__name__)


def ensure_json_serializable(value: Any) -> Any:
    """
    Gemini sometimes returns nested structures that are not strictly JSON-serializable
    (e.g. odd numeric types). PostgreSQL JSON columns + FastAPI responses need plain
    JSON types — round-trip through json.dumps(..., default=str) normalizes safely.
    """
    try:
        return json.loads(json.dumps(value, default=str))
    except (TypeError, ValueError) as exc:
        logger.warning("ensure_json_serializable failed: %s", exc, exc_info=True)
        if isinstance(value, dict):
            return {}
        if isinstance(value, list):
            return []
        return value


def _format_analysis_created_at(ts: Any) -> str:
    """`created_at` is usually datetime; tolerate str/other from drivers or legacy rows."""
    if ts is None:
        return ""
    if isinstance(ts, datetime):
        try:
            return ts.isoformat()
        except Exception:
            return str(ts)
    if isinstance(ts, date):
        try:
            return ts.isoformat()
        except Exception:
            return str(ts)
    return str(ts)


def _coerce_score(value: Any) -> Optional[float]:
    """Return clamped 0–100 float, or None if missing / invalid (no fabricated default)."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return max(0.0, min(100.0, f))


def _resolve_scores(
    analysis: ResumeAnalysis, data: Dict[str, Any]
) -> tuple[Optional[float], Optional[float]]:
    """
    Prefer ORM columns; if absent, fall back to stored analysis_data from Gemini.
    """
    score = _coerce_score(analysis.overall_score)
    ats = _coerce_score(analysis.ats_score)
    if score is None:
        score = _coerce_score(data.get("overall_score"))
    if score is None:
        score = _coerce_score(data.get("score"))
    if ats is None:
        ats = _coerce_score(data.get("ats_score"))
    return score, ats


def _normalize_strengths(raw: Any) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if raw is None:
        return out
    if not isinstance(raw, list):
        return out
    for item in raw:
        if isinstance(item, str) and item.strip():
            out.append({"title": "Strength", "description": item.strip()})
        elif isinstance(item, dict):
            title = str(
                item.get("title")
                or item.get("name")
                or item.get("heading")
                or "Strength"
            )
            desc = str(
                item.get("description")
                or item.get("detail")
                or item.get("text")
                or ""
            )
            if desc.strip() or title.strip():
                row: Dict[str, Any] = {"title": title, "description": desc}
                rel = item.get("relevance")
                if rel is not None:
                    row["relevance"] = str(rel)
                out.append(row)
    return out


def _feedback_item_from_string(text: str) -> Dict[str, Any]:
    """Map a plain-string weakness line to the shape the resume UI expects."""
    t = text.strip()
    return {
        "job_wants": "",
        "you_have": "",
        "fix": t,
        "example_line": None,
        "bonus": None,
        "severity": "medium",
    }


def _normalize_feedback_item_row(item: Any) -> Optional[Dict[str, Any]]:
    if isinstance(item, str) and item.strip():
        return _feedback_item_from_string(item)
    if not isinstance(item, dict):
        return None
    return {
        "job_wants": str(item.get("job_wants", "") or ""),
        "you_have": str(item.get("you_have", "") or ""),
        "fix": str(item.get("fix", "") or ""),
        "example_line": item.get("example_line") or item.get("example"),
        "bonus": item.get("bonus"),
        "severity": item.get("severity") or item.get("priority") or "medium",
    }


def _normalize_feedback_categories(raw: Any) -> List[Dict[str, Any]]:
    """Gemini returns a flat list of dicts; UI expects [{ category, items: [...] }]."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        return []
    if not raw:
        return []
    first = raw[0]
    if isinstance(first, dict) and "items" in first and isinstance(first.get("items"), list):
        out: List[Dict[str, Any]] = []
        for grp in raw:
            if not isinstance(grp, dict):
                continue
            cat = str(grp.get("category") or "General")
            items_in = grp.get("items") or []
            norm_items: List[Dict[str, Any]] = []
            if isinstance(items_in, list):
                for it in items_in:
                    row = _normalize_feedback_item_row(it)
                    if row and (
                        row.get("fix")
                        or row.get("job_wants")
                        or row.get("you_have")
                    ):
                        norm_items.append(row)
            if norm_items:
                out.append({"category": cat, "items": norm_items})
        return out

    groups: Dict[str, List[Dict[str, Any]]] = {}
    for item in raw:
        if not isinstance(item, dict):
            continue
        cat = str(item.get("category") or "General")
        groups.setdefault(cat, []).append(
            {
                "job_wants": str(item.get("job_wants", "")),
                "you_have": str(item.get("you_have", "")),
                "fix": str(item.get("fix", "")),
                "example_line": item.get("example_line")
                or item.get("example"),
                "bonus": item.get("bonus"),
                "severity": item.get("severity")
                or item.get("priority")
                or "medium",
            }
        )
    return [{"category": k, "items": v} for k, v in groups.items()]


def _recommendations_to_improvements(recs: Any) -> List[Dict[str, Any]]:
    if not isinstance(recs, list):
        return []
    out: List[Dict[str, Any]] = []
    for r in recs:
        if isinstance(r, str) and r.strip():
            out.append({"explanation": r.strip()})
        elif isinstance(r, dict):
            expl = r.get("explanation") or r.get("text") or r.get("suggestion")
            if expl:
                row = {"explanation": str(expl)}
                if r.get("category"):
                    row["category"] = str(r["category"])
                if r.get("before"):
                    row["before"] = str(r["before"])
                if r.get("after"):
                    row["after"] = str(r["after"])
                out.append(row)
    return out


def build_analysis_api_dict(resume: Resume, analysis: ResumeAnalysis) -> Dict[str, Any]:
    data = analysis.analysis_data if isinstance(analysis.analysis_data, dict) else {}

    strengths_raw = (
        analysis.strengths
        if analysis.strengths is not None
        else data.get("strengths", [])
    )
    recs_raw = (
        analysis.recommendations
        if analysis.recommendations is not None
        else data.get("recommendations", [])
    )
    feedback_raw = data.get("feedback")
    if feedback_raw is None:
        feedback_raw = data.get("weaknesses")
    if feedback_raw is None:
        feedback_raw = []

    strengths = _normalize_strengths(strengths_raw)
    feedback = _normalize_feedback_categories(feedback_raw)

    imp_raw = data.get("improvements")
    if isinstance(imp_raw, list) and imp_raw:
        improvements = _recommendations_to_improvements(imp_raw)
    else:
        improvements = _recommendations_to_improvements(recs_raw)

    sug_raw = data.get("suggestions")
    if isinstance(sug_raw, list) and sug_raw:
        suggestions = [
            str(s).strip()
            for s in sug_raw
            if isinstance(s, str) and str(s).strip()
        ]
    else:
        suggestions = [
            str(s).strip()
            for s in (recs_raw if isinstance(recs_raw, list) else [])
            if isinstance(s, str) and str(s).strip()
        ]

    score, ats = _resolve_scores(analysis, data)

    rid = str(resume.id)
    created = _format_analysis_created_at(analysis.created_at)

    out: Dict[str, Any] = {
        "id": rid,
        "resume_id": rid,
        "filename": resume.filename,
        "analysis_id": str(analysis.id),
        "content": resume.content,
        "original_content": resume.content,
        "strengths": strengths,
        "weaknesses": feedback,
        "feedback": feedback,
        "suggestions": suggestions,
        "improvements": improvements,
        "extracted_info": data.get("extracted_info") or {},
        "job_matches": data.get("job_matches") or [],
        "keyword_analysis": data.get("keyword_analysis") or {},
        "created_at": created,
        "data_source": data.get("data_source", "database"),
    }
    if score is not None:
        out["score"] = score
        out["overall_score"] = score
    if ats is not None:
        out["ats_score"] = ats
    return out

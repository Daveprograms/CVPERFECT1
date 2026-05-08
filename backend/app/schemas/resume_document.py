"""
Canonical `ResumeDocument` schema (Pydantic v2).

This is the *only* representation of resume content used by the editor, the
template renderer, the PDF/DOCX exporters, the ATS scoring engine, and every AI
feature. Templates control design; this module controls content.

See `docs/architecture/02_resume_document_schema.md` for design rationale and
field semantics. If this file disagrees with that document, fix the file.
"""

from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from typing import Annotated, Any, Dict, List, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    StringConstraints,
    field_validator,
    model_validator,
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CURRENT_SCHEMA_VERSION: int = 1

SECTION_KEYS = (
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "awards",
    "publications",
    "volunteer",
    "languages",
    "interests",
    "custom",
)

DEFAULT_SECTION_ORDER: List[str] = list(SECTION_KEYS)

_DATE_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
_DATE_FULL_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
_ID_RE = re.compile(r"^[a-z]{2,4}_[A-Za-z0-9_-]{1,32}$")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(8)[:10].replace('-', '_')}"


def _normalize_date(v: Optional[str]) -> Optional[str]:
    """Accept YYYY-MM or YYYY-MM-DD; emit YYYY-MM. Reject YYYY alone."""
    if v is None or v == "":
        return None
    s = str(v).strip()
    if _DATE_RE.match(s):
        return s
    if _DATE_FULL_RE.match(s):
        return s[:7]
    raise ValueError(f"date must be YYYY-MM (got {v!r})")


def _strip_text(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return re.sub(r"[ \t]+", " ", s)


# ---------------------------------------------------------------------------
# Re-usable primitives
# ---------------------------------------------------------------------------

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=140)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=480)]
BulletText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=280)]


class ItemId(BaseModel):
    """Mixin: every section item must have a stable id for drag/drop + diffing."""

    id: str = Field(default_factory=lambda: _new_id("itm"))

    @field_validator("id")
    @classmethod
    def _id_format(cls, v: str) -> str:
        if not _ID_RE.match(v):
            raise ValueError("id must match ^[a-z]{2,4}_[A-Za-z0-9_-]{1,32}$")
        return v


class Location(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: Optional[ShortText] = None
    region: Optional[ShortText] = None
    country: Optional[ShortText] = None


class Link(ItemId):
    model_config = ConfigDict(extra="forbid")

    label: ShortText
    url: HttpUrl


# ---------------------------------------------------------------------------
# Section item models
# ---------------------------------------------------------------------------

class ExperienceItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    company: ShortText
    title: ShortText
    location: Optional[Location] = None
    start: Optional[str] = None  # YYYY-MM
    end: Optional[str] = None    # YYYY-MM or null = present
    bullets: List[BulletText] = Field(default_factory=list)
    tags: List[ShortText] = Field(default_factory=list)

    @field_validator("start", "end", mode="before")
    @classmethod
    def _v_date(cls, v): return _normalize_date(v)

    @model_validator(mode="after")
    def _v_date_order(self) -> "ExperienceItem":
        if self.start and self.end and self.start > self.end:
            raise ValueError("experience.end must be >= experience.start")
        return self


class EducationItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    school: ShortText
    degree: Optional[ShortText] = None
    field: Optional[ShortText] = None
    start: Optional[str] = None
    end: Optional[str] = None
    gpa: Optional[Annotated[float, Field(ge=0.0, le=5.0)]] = None
    honors: List[ShortText] = Field(default_factory=list)
    bullets: List[BulletText] = Field(default_factory=list)

    @field_validator("start", "end", mode="before")
    @classmethod
    def _v_date(cls, v): return _normalize_date(v)


class SkillGroup(ItemId):
    model_config = ConfigDict(extra="forbid")

    category: ShortText
    items: List[ShortText] = Field(default_factory=list)


class ProjectItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    name: ShortText
    url: Optional[HttpUrl] = None
    role: Optional[ShortText] = None
    start: Optional[str] = None
    end: Optional[str] = None
    bullets: List[BulletText] = Field(default_factory=list)
    tags: List[ShortText] = Field(default_factory=list)

    @field_validator("start", "end", mode="before")
    @classmethod
    def _v_date(cls, v): return _normalize_date(v)


class CertificationItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    name: ShortText
    issuer: Optional[ShortText] = None
    year: Optional[Annotated[str, StringConstraints(pattern=r"^\d{4}$")]] = None
    url: Optional[HttpUrl] = None


class AwardItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    name: ShortText
    issuer: Optional[ShortText] = None
    year: Optional[Annotated[str, StringConstraints(pattern=r"^\d{4}$")]] = None
    description: Optional[LongText] = None


class PublicationItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    title: ShortText
    venue: Optional[ShortText] = None
    year: Optional[Annotated[str, StringConstraints(pattern=r"^\d{4}$")]] = None
    url: Optional[HttpUrl] = None
    authors: List[ShortText] = Field(default_factory=list)


class VolunteerItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    org: ShortText
    role: Optional[ShortText] = None
    start: Optional[str] = None
    end: Optional[str] = None
    bullets: List[BulletText] = Field(default_factory=list)

    @field_validator("start", "end", mode="before")
    @classmethod
    def _v_date(cls, v): return _normalize_date(v)


LanguageProficiency = Literal["native", "fluent", "professional", "basic"]


class LanguageItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    name: ShortText
    proficiency: LanguageProficiency = "professional"


class InterestItem(ItemId):
    model_config = ConfigDict(extra="forbid")

    label: ShortText


class CustomEntry(ItemId):
    model_config = ConfigDict(extra="forbid")

    title: ShortText
    subtitle: Optional[ShortText] = None
    date: Optional[str] = None
    bullets: List[BulletText] = Field(default_factory=list)

    @field_validator("date", mode="before")
    @classmethod
    def _v_date(cls, v): return _normalize_date(v)


class CustomSection(ItemId):
    """An entire user-defined section (e.g., 'Speaking')."""

    model_config = ConfigDict(extra="forbid")

    key: Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9_]{0,31}$")]
    title: ShortText
    items: List[CustomEntry] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Top-level pieces
# ---------------------------------------------------------------------------

class Basics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] = ""
    headline: ShortText = ""
    email: Optional[Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, max_length=254)]] = None
    phone: Optional[ShortText] = None
    location: Optional[Location] = None
    links: List[Link] = Field(default_factory=list)
    photo_url: Optional[HttpUrl] = None

    @field_validator("email")
    @classmethod
    def _v_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if "@" not in v or "." not in v.split("@", 1)[-1]:
            raise ValueError("invalid email")
        return v


class Metadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: int = CURRENT_SCHEMA_VERSION
    language: Annotated[str, StringConstraints(pattern=r"^[a-z]{2}(-[A-Z]{2})?$")] = "en"
    locale: Annotated[str, StringConstraints(pattern=r"^[a-z]{2}-[A-Z]{2}$")] = "en-US"
    section_order: List[Annotated[str, StringConstraints(pattern=r"^[a-z][a-z0-9_]{0,31}$")]] = Field(
        default_factory=lambda: list(DEFAULT_SECTION_ORDER)
    )
    section_visibility: Dict[str, bool] = Field(default_factory=dict)
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# The document itself
# ---------------------------------------------------------------------------

class ResumeDocument(BaseModel):
    """
    Canonical structured resume content. JSONB-friendly: every field
    serializes losslessly to JSON via `model_dump(mode="json")`.
    """

    model_config = ConfigDict(extra="forbid")

    metadata: Metadata = Field(default_factory=Metadata)
    basics: Basics = Field(default_factory=Basics)

    summary: LongText = ""

    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[SkillGroup] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    awards: List[AwardItem] = Field(default_factory=list)
    publications: List[PublicationItem] = Field(default_factory=list)
    volunteer: List[VolunteerItem] = Field(default_factory=list)
    languages: List[LanguageItem] = Field(default_factory=list)
    interests: List[InterestItem] = Field(default_factory=list)

    custom: List[CustomSection] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def _ensure_id(item: Any, prefix: str) -> Any:
    cur = getattr(item, "id", None)
    if not cur or not _ID_RE.match(cur):
        item.id = _new_id(prefix)
    return item


def _dedupe_case_insensitive(items: List[str]) -> List[str]:
    seen: set[str] = set()
    out: List[str] = []
    for it in items:
        k = it.strip().lower()
        if k and k not in seen:
            seen.add(k)
            out.append(it.strip())
    return out


def _sort_by_recency(items: List[Any]) -> List[Any]:
    def key(it: Any) -> tuple[str, str]:
        end = getattr(it, "end", None) or "9999-12"
        start = getattr(it, "start", None) or "0000-00"
        return (end, start)
    return sorted(items, key=key, reverse=True)


def normalize(doc: ResumeDocument) -> ResumeDocument:
    """
    Apply the normalization rules from `docs/architecture/02_resume_document_schema.md`.
    Lossless of meaning, lossy of formatting (which is the point).
    """

    # 1. Stable ids on everything
    for prefix, lst in [
        ("exp", doc.experience),
        ("edu", doc.education),
        ("skg", doc.skills),
        ("prj", doc.projects),
        ("crt", doc.certifications),
        ("awd", doc.awards),
        ("pub", doc.publications),
        ("vol", doc.volunteer),
        ("lng", doc.languages),
        ("int", doc.interests),
    ]:
        for it in lst:
            _ensure_id(it, prefix)
    for cs in doc.custom:
        _ensure_id(cs, "cst")
        for entry in cs.items:
            _ensure_id(entry, "csi")
    for ln in doc.basics.links:
        _ensure_id(ln, "lnk")

    # 2. Drop empty bullets / empty experience items
    for it in doc.experience:
        it.bullets = [b for b in it.bullets if b.strip()]
    doc.experience = [
        it for it in doc.experience
        if it.company.strip() or it.title.strip() or it.bullets
    ]
    for it in doc.education:
        it.bullets = [b for b in it.bullets if b.strip()]
    doc.education = [it for it in doc.education if it.school.strip()]
    for it in doc.projects:
        it.bullets = [b for b in it.bullets if b.strip()]
    doc.projects = [it for it in doc.projects if it.name.strip()]
    for it in doc.volunteer:
        it.bullets = [b for b in it.bullets if b.strip()]
    doc.volunteer = [it for it in doc.volunteer if it.org.strip()]

    # 3. Skill / link de-duplication
    for sg in doc.skills:
        sg.items = _dedupe_case_insensitive(sg.items)
    seen_urls: set[str] = set()
    deduped_links: List[Link] = []
    for ln in doc.basics.links:
        u = str(ln.url).rstrip("/").lower()
        if u in seen_urls:
            continue
        seen_urls.add(u)
        deduped_links.append(ln)
    doc.basics.links = deduped_links

    # 4. Sort by recency
    doc.experience = _sort_by_recency(doc.experience)
    doc.education = _sort_by_recency(doc.education)
    doc.projects = _sort_by_recency(doc.projects)
    doc.volunteer = _sort_by_recency(doc.volunteer)

    # 5. Section order: ensure default + append any new sections present in doc
    if not doc.metadata.section_order:
        doc.metadata.section_order = list(DEFAULT_SECTION_ORDER)
    for k in DEFAULT_SECTION_ORDER:
        if k not in doc.metadata.section_order:
            doc.metadata.section_order.append(k)

    # 6. Visibility defaults: any section not explicitly set is visible
    for k in doc.metadata.section_order:
        doc.metadata.section_visibility.setdefault(k, True)

    # 7. Updated timestamp
    doc.metadata.updated_at = datetime.now(timezone.utc)

    return doc


# ---------------------------------------------------------------------------
# Schema migration (forward-only)
# ---------------------------------------------------------------------------

def migrate_to_latest(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate any prior `schema_version` forward. Today there is only v1, so this
    is a no-op + version-stamping. Future: chain `migrate_v1_to_v2`, etc.
    """
    if not isinstance(raw, dict):
        raise TypeError("ResumeDocument migration expects a dict")
    md = raw.setdefault("metadata", {})
    md.setdefault("schema_version", CURRENT_SCHEMA_VERSION)
    return raw


# ---------------------------------------------------------------------------
# Public load API used by routes / workers
# ---------------------------------------------------------------------------

def load_and_normalize(raw: Optional[Dict[str, Any]]) -> ResumeDocument:
    """
    Read path used everywhere we materialize a ResumeDocument from JSONB.
    """
    if not raw:
        return normalize(ResumeDocument())
    migrated = migrate_to_latest(dict(raw))
    return normalize(ResumeDocument.model_validate(migrated))


def to_storage(doc: ResumeDocument) -> Dict[str, Any]:
    """
    Write path used everywhere we persist a ResumeDocument to JSONB.
    Always normalizes first.
    """
    return normalize(doc).model_dump(mode="json")


__all__ = [
    "CURRENT_SCHEMA_VERSION",
    "SECTION_KEYS",
    "DEFAULT_SECTION_ORDER",
    "ResumeDocument",
    "Metadata",
    "Basics",
    "Location",
    "Link",
    "ExperienceItem",
    "EducationItem",
    "SkillGroup",
    "ProjectItem",
    "CertificationItem",
    "AwardItem",
    "PublicationItem",
    "VolunteerItem",
    "LanguageItem",
    "InterestItem",
    "CustomEntry",
    "CustomSection",
    "normalize",
    "migrate_to_latest",
    "load_and_normalize",
    "to_storage",
]

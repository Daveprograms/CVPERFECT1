# `ResumeDocument` — Canonical Resume Schema

> Implements ADR-001. Source-of-truth content type for the entire system.
> Concrete code:
> - Pydantic v2: `backend/app/schemas/resume_document.py`
> - Zod (TS): `frontend/lib/resume-document/schema.ts`
> - Shared TS types: `frontend/lib/resume-document/types.ts`

This document defines the data model that powers the editor, the template renderer, the
PDF/DOCX exporters, the ATS scoring engine, and every AI feature. **Templates control
design; `ResumeDocument` controls content.** Nothing else stores resume content.

---

## 1. Design principles

1. **Strict, additive, versioned.** Every change bumps `metadata.schema_version`.
   Servers must accept any prior version and migrate forward in `normalize()`.
2. **Block-typed, not free-text.** Bullets are arrays of strings. Dates are
   `YYYY-MM` strings. No HTML, no Markdown in fields meant for the renderer.
3. **No presentation in content.** No fonts, no colors, no `class` names, no `style`
   attributes. Everything visual lives on the template/theme side.
4. **Stable ids per item.** Every section item carries a UUID `id` so the editor can
   drag/drop and the diff engine can produce stable patches.
5. **Section order is data.** `metadata.section_order` controls *which* sections render
   and *in what order*; templates apply per-section styling but do not decide order.
6. **Visibility is data.** `metadata.section_visibility` lets users hide a section in
   one variant (e.g., omit "Projects" for a senior PM tailoring) without deleting it.
7. **Locale-aware.** `metadata.language` (BCP-47), `metadata.locale` (e.g. `en-US`).
   Templates may localize date formatting; content stays in raw `YYYY-MM`.
8. **No nullable strings on required fields.** Use `""` for unknown short text;
   use `null` only on optional date fields like `experience[].end`.

---

## 2. Top-level shape

```jsonc
{
  "metadata": {
    "schema_version": 1,
    "language": "en",
    "locale": "en-US",
    "section_order": [
      "summary","experience","education","skills","projects","certifications","awards","publications","volunteer","languages","interests","custom"
    ],
    "section_visibility": {
      "summary": true,
      "projects": false
    },
    "updated_at": "2026-05-07T05:11:15.394Z"
  },

  "basics": {
    "name": "Jane Smith",
    "headline": "Senior Software Engineer",
    "email": "jane@example.com",
    "phone": "+1 555-555-1234",
    "location": { "city": "Austin", "region": "TX", "country": "US" },
    "links": [
      { "id": "lnk_01", "label": "LinkedIn", "url": "https://linkedin.com/in/jane" },
      { "id": "lnk_02", "label": "GitHub",   "url": "https://github.com/jane" }
    ],
    "photo_url": null
  },

  "summary": "One-paragraph elevator pitch (kept short; <= 480 chars).",

  "experience": [
    {
      "id": "exp_01",
      "company": "Acme Corp",
      "title": "Staff Engineer",
      "location": { "city": "Remote", "region": null, "country": "US" },
      "start": "2022-04",
      "end": null,
      "bullets": [
        "Reduced p99 checkout latency from 1.8s to 420ms by ...",
        "Owned the migration from Aurora to Spanner ..."
      ],
      "tags": ["leadership","platform"]
    }
  ],

  "education": [
    {
      "id": "edu_01",
      "school": "University of Texas at Austin",
      "degree": "B.S.",
      "field": "Computer Science",
      "start": "2014-08",
      "end": "2018-05",
      "gpa": null,
      "honors": ["cum laude"],
      "bullets": []
    }
  ],

  "skills": [
    { "id": "skg_01", "category": "Languages",   "items": ["Go","TypeScript","Python"] },
    { "id": "skg_02", "category": "Infra",       "items": ["GCP","Terraform","Kubernetes"] }
  ],

  "projects": [
    {
      "id": "prj_01",
      "name": "OpenATS",
      "url": "https://github.com/jane/openats",
      "role": "Creator",
      "start": "2023-09",
      "end": "2024-02",
      "bullets": ["Built an OSS ATS that ..."]
    }
  ],

  "certifications": [
    { "id": "crt_01", "name": "AWS Solutions Architect", "issuer": "AWS", "year": "2023", "url": null }
  ],

  "awards":         [ /* { id, name, issuer, year, description } */ ],
  "publications":   [ /* { id, title, venue, year, url, authors[] } */ ],
  "volunteer":      [ /* { id, org, role, start, end, bullets[] } */ ],
  "languages":      [ /* { id, name, proficiency: "native"|"fluent"|"professional"|"basic" } */ ],
  "interests":      [ /* { id, label } */ ],

  "custom": [
    {
      "id": "cst_01",
      "key": "speaking",
      "title": "Speaking",
      "items": [
        { "id": "csi_01", "title": "KubeCon NA 2024", "subtitle": "Spanner @ Scale", "date": "2024-11", "bullets": [] }
      ]
    }
  ]
}
```

### Why these sections (and only these)
This is the union of fields supported by Resume.io / Rezi / Reactive Resume / JSON Resume.
`custom` exists for one-off sections so we never need to bend the schema for a single
user.

---

## 3. Field semantics & validation rules

### Dates
- Format: `YYYY-MM` (zero-padded). `YYYY-MM-DD` accepted on input but normalized to
  `YYYY-MM` on save (resumes don't show day granularity).
- `start <= end` when both present. `end: null` means "present" (renderer shows
  "Present" / localized equivalent).

### Strings
- All free-text fields are **plain text** with `\n` allowed. No HTML/Markdown.
- Bullets: each bullet 1–280 chars; we surface a soft warning at 240+, hard fail at 280.
- `summary`: max 480 chars (one strong paragraph).
- `name`: max 120 chars; `headline`: max 140; `email`: validated as email; `url`:
  validated as `https?://...`.

### Ids
- All item ids match `^[a-z]{2,4}_[A-Za-z0-9_-]{1,32}$`. The editor generates UUID-shaped
  suffixes; we keep them short for log readability.

### Lists
- `items[]` arrays may be empty (`[]`). They are never `null`.
- A whole section may be omitted by setting `metadata.section_visibility[section] = false`,
  not by removing the array.

### Photos
- `basics.photo_url` is optional and points at object storage. Most templates ignore it.
  ATS-safe templates ignore it categorically.

### Tags
- `experience[].tags`, `projects[].tags` are renderer hints only (e.g., highlight a chip).
  Templates may show or ignore them. AI tailoring uses them for ranking.

---

## 4. Section order and visibility

```jsonc
"metadata": {
  "section_order": ["summary","experience","skills","projects","education","certifications"],
  "section_visibility": { "summary": true, "projects": false }
}
```

- `section_order` is the source of truth for top-to-bottom order in single-column
  templates and primary-column order in multi-column templates.
- `section_visibility` defaults to `true` for every present section. Setting `false`
  hides it without losing the data. The renderer skips it; the ATS engine skips it.
- Templates declare a default `section_order` and a per-template `slot_map`
  (e.g., "in this template, `skills` and `languages` always render in the sidebar").
  The engine merges user `section_order` with the template `slot_map` deterministically
  (see `04_template_engine.md`).

---

## 5. Normalization rules (`normalize(doc) -> doc`)

The schema validators only check shape. Normalization ensures *semantic* sanity. Run
on every server-side write **and** before every render/export.

1. Trim whitespace on every string field; collapse internal `\s+` (preserving `\n`).
2. Lower-case email; strip leading/trailing punctuation from URLs.
3. Convert dates to `YYYY-MM`. Reject `YYYY` alone (force user to specify a month).
4. De-duplicate `skills[].items` (case-insensitive) within a category.
5. De-duplicate `links` by URL (case-insensitive host).
6. Sort `experience` and `education` by `(end ?? "9999-12") DESC, start DESC`.
7. Generate ids for any item missing one.
8. Drop empty bullets. Drop empty section items (e.g., experience with no company AND
   no bullets).
9. Fill `metadata.section_order` with default if missing; append any new sections that
   appear in `doc` but not in the order list.
10. Set `metadata.updated_at = now()`.

Normalization is **lossless of meaning** but *not* of formatting. Users get back exactly
the structured data they put in, just normalized; raw text formatting is gone (which is
the whole point of separating content from design).

---

## 6. Versioning policy

- `metadata.schema_version` starts at `1`.
- Backward-incompatible changes (renamed field, removed required field, changed type)
  bump to `2` and ship a `migrate_v1_to_v2(doc)` function on **both** server and client.
- Backward-compatible additions (new optional field, new section in `custom`) keep the
  same `schema_version` but bump a `metadata.updated_at`.
- Every read normalizes + migrates forward; no row ever stays at an older
  `schema_version` after a successful write.

---

## 7. Source text vs. document JSON

- `resumes.source_text` (renamed from `content`) keeps the raw extracted text. Used
  for: LLM grounding when re-parsing, full-text search, audit ("what did the original
  PDF say?").
- `resumes.document_json` is the editable, renderable truth.
- `resumes.source_text` is **read-only** after upload. Edits go to `document_json`.

This split is what allows the AI Reconstruction phase to keep improving without losing
the original.

---

## 8. AI integration contract

All AI features that produce or consume resume content speak `ResumeDocument`:

- **Parse-from-text** (PDF/DOCX upload): produces a `ResumeDocument`.
- **Reconstruct/clean** (rewrite messy resume): consumes a `ResumeDocument`,
  produces a `ResumeDocument`. Diff is shown to the user before saving.
- **Tailor for JD**: consumes `ResumeDocument` + `JobDescription`, produces a new
  `ResumeDocument` (saved as a `ResumeVariant` of kind `tailored`).
- **ATS analyze**: consumes `ResumeDocument` (+ optional JD), produces a
  `ResumeAnalysis` JSON (separate schema, see `05_ai_pipeline.md`).
- **Cover letter**: consumes `ResumeDocument` + `JobDescription`, produces a
  `CoverLetterOutline` (strict JSON) followed by prose.

AI is never allowed to invent presentation; it only writes content.

---

## 9. Concrete code references

- `backend/app/schemas/resume_document.py` — Pydantic v2 models + `normalize()` +
  `migrate_to_latest()`.
- `frontend/lib/resume-document/schema.ts` — Zod schemas mirroring the Pydantic ones.
- `frontend/lib/resume-document/types.ts` — TS types (inferred from Zod).
- `frontend/lib/resume-document/normalize.ts` — TS port of the normalize rules (used
  in the editor for instant feedback; server still re-normalizes on write).

These four files are the canonical reference for any future change. If any of them
disagree with this document, **the code is wrong, not this document** — fix the code.

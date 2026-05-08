# Step-by-step implementation roadmap (priority-aligned)

This roadmap is ordered exactly by your priority list:

1. Resume template + formatting engine
2. AI resume reconstruction
3. ATS optimization improvements
4. Cover letter improvements
5. Resume variants per job
6. Job application automation
7. Analytics
8. Payments/subscriptions

It includes concrete milestones, acceptance criteria, and the code areas to touch.

---

## Phase 0 — Stabilize current system (stop production foot-guns)

### 0.1 Fix broken endpoints + schema drift
**Why:** several routes will 500 due to model/schema drift; export is a stub; analytics is broken.

**Tasks**
- Replace `backend/app/routes/resume.py` `/download/{resume_id}` logic to read `ResumeAnalysis`
  (or remove in favor of `resume_exports`).
- Fix `backend/app/routes/analytics.py` to compute from `ResumeAnalysis.overall_score`.
- Fix `backend/app/routes/analytics.py` `resume_id: int` -> UUID.
- Fix analytics metadata bug: use `meta_data=` (not `metadata=`) when creating `Analytics`.
- Remove PII logging from resume + gemini logs.

**Acceptance**
- No 500s on these endpoints in dev.
- One consistent response shape (or at least consistent `detail` messages).

### 0.2 Stamp Alembic history to match DB reality
**Why:** your DB already contains objects Alembic tries to create, causing `DuplicateTable` and `DuplicateObject`.

**Tasks**
- Inspect `alembic_version` in the DB.
- If tables from 000–004 already exist, run:
  - `alembic stamp 004_password_reset`
  - then `alembic upgrade head` (to apply `efcad529a5a6_resume_engine_tables.py`)

**Acceptance**
- `alembic upgrade head` runs cleanly on the target DB with no duplicate errors.

---

## Phase 1 — Structured resume content (ResumeDocument)

### 1.1 Add canonical schema + validators
Already implemented:
- Pydantic: `backend/app/schemas/resume_document.py`
- Zod: `frontend/lib/resume-document/*`

**Tasks**
- Add `document_json` write/read endpoints (behind auth).
- Update resume upload to store `source_text` and create the initial `document_json`
  via parsing pipeline (see 1.2).

### 1.2 Resume parsing pipeline (upload -> structured JSON)

**Pipeline**
1. Extract text (existing): `backend/app/utils/file_processing.py`
2. Deterministic heuristics (fast): header detection, section headings, bullet grouping
3. AI reconstruction (strict JSON): `ResumeParseAI` -> `ResumeDocument`
4. Normalize + persist (`document_json` + `content_hash`)

**Acceptance**
- Upload results in a non-null `document_json` for new uploads.
- A “legacy” resume with only `content` will backfill `document_json` on first open (job-based).

---

## Phase 2 — Resume template + formatting engine (your #1 priority)

### 2.1 Template registry + tokens + render entrypoint
Already scaffolded:
- `frontend/lib/resume-templates/*`
- Spec: `docs/architecture/04_template_engine.md`

**Tasks**
- Implement template components (`<ModernCleanTemplate />`) that render:
  - header (basics)
  - section blocks for `experience`, `education`, etc.
- Add per-section renderers with consistent typography and spacing.
- Add pagination wrappers and print CSS.

**Acceptance**
- Switching templates changes layout instantly without modifying content.
- Preview == exported PDF (pixel-level match).

### 2.2 Editor UX (structured editing)
**Tasks**
- Implement a section-based editor:
  - add/edit experience items and bullets
  - drag/drop reorder sections and items
  - section visibility toggles
  - inline validation (Zod) with friendly error messages
- Persist edits to backend as `document_json`.

**Acceptance**
- User can edit structured fields and see live preview update.
- No raw textarea-only editing for the primary editor path.

---

## Phase 3 — Export system (PDF/DOCX)

### 3.1 Background jobs + export records
Already introduced at schema level:
- `resume_exports`, `background_jobs`, `ai_runs` in migration `efcad529a5a6...`

**Tasks**
- Create `POST /api/exports` -> enqueue job -> return job id.
- Worker renders:
  - PDF via headless Chromium using template HTML
  - DOCX via DOCX renderer consuming `ResumeDocument`
- Store artifacts in object storage and return signed URLs.

**Acceptance**
- Export produces real PDF bytes and real DOCX bytes.
- Export is idempotent for the same (variant, template, theme, format).

---

## Phase 4 — AI resume reconstruction + tailoring (strict JSON)

### 4.1 Unify AI calls behind AIRunner
Already scaffolded:
- `backend/app/services/ai_runner.py`

**Tasks**
- Move all structured AI features to `get_ai_runner().call_json(...)`.
- Add `ResumeTailorAI` (ResumeDocument + JobDescription -> ResumeDocument / patch).
- Persist results as new `resume_variants` rows (kind = `tailored`).

**Acceptance**
- AI never returns raw paragraphs for structured features.
- Invalid responses are rejected and recorded in `ai_runs`.

---

## Phase 5 — ATS optimization engine (hybrid)

### 5.1 Deterministic scoring baseline
**Tasks**
- Implement deterministic checks:
  - keyword coverage against JD (exact + stemming)
  - section completeness
  - bullet quality heuristics (action verbs, metrics)
  - formatting safety rules per template
- Layer LLM semantic scoring as additive, never the only score.

**Acceptance**
- ATS score is explainable (breakdown) and stable across runs.

---

## Phase 6 — Cover letter engine upgrades

**Tasks**
- Generate strict JSON outline first (`CoverLetterOutlineAI`), then prose.
- Persist outline + final letter tied to `job_descriptions` and `resume_variants`.

**Acceptance**
- Cover letters are reproducible and auditable; personalization is consistent.

---

## Phase 7 — Variants per job + job application automation

**Tasks**
- Store a `job_description_id` on each job application.
- Store `resume_variant_id` used for that application.
- Automation features become safe because every action is tied to a variant snapshot.

---

## Phase 8 — Analytics + payments/subscriptions

**Tasks**
- Rewrite analytics to depend on `ai_runs`, `resume_exports`, `credit_ledger` not on ad-hoc counters.
- Enforce subscription limits via a central dependency (no more hardcoded `can_upload=True`).

---

## Milestone deliverables

1. **Template engine v1**: one ATS-safe template, one creative template, live switching.
2. **Structured editor v1**: experience/education/skills/projects editing + reorder + hide.
3. **Export v1**: PDF export with pixel match; DOCX export ATS-safe.
4. **Tailoring v1**: variant per job description with diff review.


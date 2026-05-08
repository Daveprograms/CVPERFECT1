# Database redesign (Resume engine + production-grade primitives)

This document describes the concrete schema changes required for:

1. Content/design separation (`ResumeDocument` JSONB + templates/themes)
2. Resume versioning + variants per job
3. Export artifacts (PDF/DOCX) as first-class records
4. Strictly-audited AI runs (model/prompt/latency/tokens/cost)
5. Credits/usage ledger
6. Background job queue (so HTTP doesn’t become the queue)

It is written against your existing schema in `backend/app/models/*` and Alembic chain
`backend/alembic/versions/000..004`.

---

## 0. Current schema issues that block production

### 0.1 Schema drift + non-reproducible baseline
`backend/alembic/versions/000_initial_core_schema.py` uses `Base.metadata.create_all`.
That makes “baseline schema” depend on the current ORM definitions at migration time.
This is why you keep seeing duplicate tables / enums when migrating against an already
partially-initialized DB.

### 0.2 Broken resume export/report endpoint
`backend/app/routes/resume.py` has a `/download/{resume_id}` handler that reads fields
that are not on `Resume` (e.g., `resume.score`). This must be replaced by reading
`resume_analyses` or by introducing `resume_exports`.

### 0.3 No job-aware resume variants
The existing `resume_versions` table is linear and context-free. You cannot model:
- “Tailored for Company X”
- “Variant used for job application Y”
- “Template A vs Template B” exports

### 0.4 No auditing primitives
No tables exist for:
- AI calls (`ai_runs`)
- exports (`resume_exports`)
- credits (`credit_ledger`)
- async work (`background_jobs`)

These are required for production debugging, cost control, and scalable UX.

---

## 1. Target tables (additive)

### 1.1 `resumes` extensions (content split)

We keep your existing `resumes.content` for backward compatibility, but introduce:

- `resumes.source_text TEXT NULL` — immutable extracted text (backfilled from `content`)
- `resumes.document_json JSONB NULL` — canonical `ResumeDocument` (schema v1)
- `resumes.content_hash VARCHAR(64) NULL` — sha256 of `source_text`
- `resumes.deleted_at TIMESTAMPTZ NULL` — soft delete

Rationale: `document_json` is what templates/editor/export/ATS read. `source_text` is
for grounding, search, and audit.

### 1.2 Templates + themes

#### `resume_templates`
Stores design-only template definitions (renderer-specific `layout_data`).

#### `resume_themes`
Stores palettes/tokens per template (design-only).

### 1.3 Job descriptions

#### `job_descriptions`
Stores raw JD text and an optional structured extraction. Required for:
- ATS scoring against a JD
- Tailored resume variants
- Cover letter generation with stable context

### 1.4 Resume variants (the core)

#### `resume_variants`
Each row is a *versioned snapshot* of a resume document:
- kind: `master|enhanced|tailored|manual_edit`
- optional `job_description_id`
- optional `template_id/theme_id` (the “preferred view” for this variant)
- content_json JSONB (`ResumeDocument`)
- content_hash for dedupe + idempotency

This replaces `resume_versions` as the production-grade versioning layer.
You can keep `resume_versions` temporarily and later migrate its rows into `resume_variants`.

### 1.5 Export artifacts

#### `resume_exports`
Each export request produces a row. Exports are idempotent by:
`(resume_variant_id, format, template_id, theme_id)`.

### 1.6 AI audit

#### `ai_runs`
One row per model call (or pipeline step). This is the “truth” for:
- which model version produced a variant
- what prompt hash was used
- latency/tokens/cost
- what validation failed

### 1.7 Credits

#### `credit_ledger`
Append-only ledger. Replaces racy counters on `users`. Enables:
- refunds
- expiry
- plan change adjustments
- auditability

### 1.8 Background jobs

#### `background_jobs`
Durable queue table. The API enqueues work; workers claim jobs. This replaces the
current `Resume.processing_status` “lock-as-queue” pattern that causes stuck 409s.

---

## 2. Concrete migration artifact

Implemented in:
- `backend/alembic/versions/efcad529a5a6_resume_engine_tables.py`

This revision:
- adds `source_text/document_json/content_hash/deleted_at` to `resumes`
- creates the new tables and enums idempotently
- adds indexes and uniqueness constraints

Important: your environment currently has migration drift (tables already exist but
alembic history may not match). In production we must **stamp** the DB to the correct
baseline, then run forward migrations.

---

## 3. Migration strategy for your existing Supabase DB (no data loss)

### Step A — align alembic history (one-time)
Because your DB already has `job_applications`, `jobs`, etc., but Alembic still tries
to create them, the DB’s `alembic_version` likely does not match reality.

The safe approach is:

1. Inspect current `alembic_version` table.
2. If the physical tables already exist for 000..004, run:
   - `alembic stamp 004_password_reset`
3. Then run:
   - `alembic upgrade head`

If you have partial objects (some tables exist, some don’t), you either:
- (preferred) create a new clean database and migrate data over, or
- manually bring the DB to match migrations (tedious and error-prone).

### Step B — backfill `source_text`
The migration already does:
`UPDATE resumes SET source_text = content WHERE source_text IS NULL AND content IS NOT NULL`

### Step C — backfill `document_json` incrementally
Do **not** run a batch Gemini job for every resume at deploy time.

Instead:
- when a user opens a legacy resume without `document_json`, enqueue `resume.parse`
- show a “Formatting resume…” spinner
- persist `document_json` and never re-run unless user requests re-parse

### Step D — start writing variants
Once the editor and AI reconstruction pipelines are live:
- new uploads create a `resume_variants` row of kind `master`
- enhancements create `enhanced`
- tailoring creates `tailored` linked to `job_descriptions`

Later: migrate `resume_versions` rows into `resume_variants` if you still want them.

---

## 4. Model stubs (code)

Implemented new SQLAlchemy models (not yet wired into routes):
- `backend/app/models/resume_template.py`
- `backend/app/models/resume_theme.py`
- `backend/app/models/job_description.py`
- `backend/app/models/resume_variant.py`
- `backend/app/models/resume_export.py`
- `backend/app/models/ai_run.py`
- `backend/app/models/credit_ledger.py`
- `backend/app/models/background_job.py`

Exports are wired into `backend/app/models/__init__.py` so Alembic can discover them.

---

## 5. Constraints + indexes (why they matter)

1. `uq_resume_variants_resume_version` prevents race conditions producing duplicate
   `version_number` for the same resume.
2. `uq_resume_variants_current_per_resume` prevents two “current” variants.
3. `uq_resume_exports_variant_format_template_theme` prevents duplicate exports for the
   same variant/template/theme/format.
4. `uq_job_descriptions_user_hash` dedupes repeated JDs pasted multiple times.
5. `ix_ai_runs_user_time` and `ix_ai_runs_kind_time` are necessary for auditing and
   debugging “why did this resume change?”.

---

## 6. Next dependencies

This schema redesign enables:
- Template engine (`04_template_engine.md`) by providing `resume_templates/themes`
- Variants-per-job and per-export idempotency
- AI pipeline redesign (`05_ai_pipeline.md`) via `ai_runs`
- Production export system (`resume_exports`)
- Removing “stuck analyzing” by moving to `background_jobs`


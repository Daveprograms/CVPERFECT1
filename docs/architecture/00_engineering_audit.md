# CVPerfect — Engineering Audit (current state, 2026)

> Read order: this audit -> `01_decisions.md` -> `02_resume_document_schema.md` -> `03_db_redesign.md` -> `04_template_engine.md` -> `05_ai_pipeline.md` -> `06_frontend_state.md` -> `07_implementation_roadmap.md`.

This document is the consolidated audit of the current `CVPERFECT1/` codebase
(Next.js 14 App Router + FastAPI + SQLAlchemy + Postgres/Supabase + Gemini).
Every finding cites the specific file path so it can be acted on without re-investigation.

---

## 0. Highest-priority runtime breakers (Phase 0 — fix first)

| # | Symptom | Root cause | File |
|---|---------|------------|------|
| 0.1 | `GET /api/resume/download/{id}` always 500 / "analysis not available" | Reads `resume.score`, `resume.feedback`, `resume.extracted_info`, `resume.job_matches`, `resume.improvements` — none of these columns exist on `Resume` | `backend/app/routes/resume.py` (download handler ~line 1010-1060) |
| 0.2 | `/api/analytics/user-insights` 500 | `func.avg(Resume.score)` but `Resume.score` does not exist; should use `ResumeAnalysis.overall_score` | `backend/app/routes/analytics.py` (~line 57-61) |
| 0.3 | `/api/analytics/resume-analytics/{resume_id}` 422 / 404 | Path declares `resume_id: int`, real ids are UUID | `backend/app/routes/analytics.py` (~line 132) |
| 0.4 | Analytics rows for resume enhance / cover-letter have `meta_data = NULL` (silent data loss) | Routes pass `metadata=...` but `Analytics` model column is `meta_data` (renamed to avoid SQLAlchemy reserved name) | `backend/app/routes/resume.py` (~lines 747, 847), `backend/app/models/analytics.py` |
| 0.5 | "Analyze" wedges in `processing_status='analyzing'` -> endless 409 | Multiple paths set status to `analyzing` and commit before failure points (model-not-available, JSON shape error). We just patched a stale-window auto-release in `resume.py`, but the underlying fix is to stop using `Resume.processing_status` as a queue. | `backend/app/routes/resume.py` (analyze handler) |
| 0.6 | "Export PDF/DOCX" returns `text/plain` named `resume.txt` | Route is a placeholder; returns the request body verbatim regardless of `format` | `frontend/app/api/resume/export/route.ts` |
| 0.7 | `User.can_upload()` always returns `True` | Hardcoded "TEMPORARILY ALWAYS ALLOW UPLOADS" bypass left in place | `backend/app/models/user.py` (~line 69-78) |
| 0.8 | PII (resume body) printed to stdout | `print("[ANALYZE PRE-GEMINI]", ..., first_300=...)` and Gemini service logs preview text | `backend/app/routes/resume.py`, `backend/app/services/gemini_service.py` |
| 0.9 | Rate limiting bypassable in any multi-worker / multi-instance deploy | `RateLimitMiddleware` uses an in-process dict keyed on IP | `backend/app/middleware/rate_limit.py` |
| 0.10 | Many filters use `str(current_user.id)` against a UUID column | UUID/string mismatch will silently match nothing in some Postgres configs | `backend/app/routes/jobs.py`, `applications.py`, `watchlist.py`, etc. |

These ten items are the Phase 0 punch list. Until they are fixed, any new feature work risks
inheriting their failure modes (especially the analyze-lock and the placeholder export route).

---

## 1. Codebase map (what actually exists)

### Frontend (Next.js 14, App Router) — `CVPERFECT1/frontend/`

```
app/
  api/                       # BFF proxy routes -> FastAPI
    auth/{me,signin,signup,signout}/route.ts
    resume/{upload,history,preview,export}/route.ts
    resume/[id]/{route.ts, update/route.ts}
    resume/analyze/[id]/route.ts
    resume/download/[id]/route.ts
    onboarding/status/route.ts
    dashboard/route.ts
  resumes/{page.tsx, upload/page.tsx, download/page.tsx}
  ai-feedback/{page.tsx, [resumeId]/page.tsx}
  dashboard/, settings/, billing/, jobs/, ...
components/
  AuthProvider.tsx
  providers.tsx              # QueryClientProvider + AuthProvider + next-themes + Toaster
  resume-editor.tsx          # legacy axios-based editor (orphan)
  ResumeSnapshot.tsx         # uses placeholder export
  resume-snapshot.tsx        # second/older snapshot (html2canvas -> PNG)
  resume/{resume-list-card.tsx, resume-page-states.tsx, resume-analysis-sections.tsx}
context/                     # competing ThemeContext + NotificationContext (mostly unused)
hooks/                       # useAuth, useResume, ...
lib/
  api/errors.ts              # normalizeApiError
  server-auth.ts             # resolveBearer
  server/backendBaseUrl.ts   # fetchBackend
  resume-download.ts
services/api.ts              # central client
middleware.ts                # auth gating
```

### Backend (FastAPI) — `CVPERFECT1/backend/`

```
main.py                      # uvicorn entrypoint (calls app.main:app)
app/
  main.py                    # FastAPI app, CORS, exception handlers, router includes
  core/
    config.py                # Pydantic Settings
    dependencies.py          # JWT/cookie auth
    error_handlers.py        # standardized {error:{...}} envelope
    exceptions.py
    cache.py                 # Redis wrapper (largely unused)
  database.py                # engine + SessionLocal, requires DATABASE_URL at import
  middleware/
    rate_limit.py            # in-memory IP limiter (unsafe for prod scale)
    subscription.py          # check_feature_access(...)
  models/
    user.py, resume.py, analytics.py, job.py, job_application.py,
    interview.py, chat.py, dream_company.py, developer_code.py
  schemas/                   # Pydantic request/response (drifted vs models)
  routes/
    auth.py, resume.py, jobs.py, chat.py, interview.py,
    applications.py, billing.py, dashboard.py, analytics.py,
    onboarding.py, settings.py, watchlist.py
  services/
    gemini_service.py        # Gemini wrapper; only resume_analyze enforces JSON MIME
    real_data_service.py     # upload + history aggregation
    storage_service.py       # optional Supabase Storage
  utils/
    file_processing.py       # PyPDF2 + PyMuPDF fallback; python-docx
    resume_analysis_format.py # build_analysis_api_dict
  workers/
    celery_app.py
    resume_tasks.py          # exists but production paths still call Gemini synchronously
alembic/, migrations/        # 000-004 with drift (see DB section)
scripts/                     # ad-hoc DB fix scripts (password_reset_cols, processing_status_at)
```

---

## 2. Frontend findings

### 2.1 State management is incoherent
- `QueryClientProvider` is mounted in `frontend/components/providers.tsx`, but core resume flows
  use `useState` + `useEffect` + direct `apiService.*` calls
  (`frontend/app/resumes/page.tsx`, `frontend/app/ai-feedback/[resumeId]/page.tsx`,
  `frontend/app/resumes/upload/page.tsx`).
- Each screen reimplements loading / error / debounce / "in-flight ref" guards.
  Example: `analyzeInFlightRef` + `lastAnalyzeClickAtRef` patterns repeated across
  `resumes/page.tsx` and `ai-feedback/[resumeId]/page.tsx` because the data layer
  has no concept of mutation state or de-duplication.

### 2.2 BFF error contract is inconsistent
`frontend/app/api/...` routes return at least three different shapes:
- `{ detail: string }` with a non-2xx status (most routes)
- `{ success: false, error: string }` with status 200 (e.g. analyze 404 / transient upstream)
- raw text body forwarded with upstream status (download/upload proxies)

`frontend/services/api.ts` then has to normalize all of these into either thrown errors
(`fetchJson`) or `{ success, data, error }` envelopes (`request`). The `request` method
explicitly treats `HTTP 200 + {success:false}` as a failure to keep the contract usable —
which is a workaround, not a contract.

### 2.3 Two competing theme/notification systems
- `next-themes` via `frontend/components/theme-provider.tsx` (the actual one in use).
- `frontend/context/ThemeContext.tsx` + `frontend/context/NotificationContext.tsx`
  with their own `data-theme` switch and notification queue. Neither is wired into the
  `Providers` tree but the files still exist and are easy to import by mistake.

### 2.4 Two resume editors (one orphan)
- `frontend/components/resume-editor.tsx` uses **axios**, expects `resumeId: number`, and
  posts to `/api/resume/${resumeId}/update` and `/api/resume/preview`. The rest of the app
  uses string UUIDs — this file is a future-bug magnet.
- A second pair `frontend/components/resume-snapshot.tsx` + small editor uses
  `html2canvas` to produce a PNG, then offers it as "download". Not aligned with the
  PDF/DOCX export expectation.

### 2.5 No structured resume model on the client
- "Preview" in `frontend/app/ai-feedback/[resumeId]/page.tsx` is `<pre>{content}</pre>`.
- `frontend/app/api/resume/preview/route.ts` returns `escapeHtml(content).replace(/\n/g, '<br/>')`.
- There is **no** `ResumeDocument` type, no template renderer, no theme tokens — every
  later phase (template engine, drag/drop, multi-template switching, ATS-safe rendering)
  is blocked on this missing primitive.

### 2.6 PDF/DOCX export is a stub
`frontend/app/api/resume/export/route.ts`:
```
const filename = format === 'docx' ? 'resume.txt' : 'resume.txt'
return new NextResponse(content, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8',
             'Content-Disposition': `attachment; filename="${filename}"` },
})
```
Users selecting PDF or DOCX get a `.txt` containing whatever the editor sent.

### 2.7 Debug logs in BFF auth-adjacent paths
`frontend/app/api/resume/download/[id]/route.ts` and `frontend/app/api/resume/upload/route.ts`
both log token presence and request shape unconditionally. Move behind
`process.env.NODE_ENV !== 'production'` or remove.

---

## 3. Backend findings

### 3.1 Resume analyze route mixes 4 concerns in one handler
`backend/app/routes/resume.py::analyze_resume` does all of:
1. UUID parsing + ownership check.
2. **Status state machine** (`analyzing` / `completed` / `failed`) — used as a queue and a lock.
3. In-process throttle (`_last_analyze_by_resume` dict + `asyncio.Lock`).
4. Synchronous Gemini call (with retries inside the service).
5. Persistence + readback + response building.

This is why the same handler keeps producing surprises: any failure between step 2 (commit `analyzing`)
and step 5 leaves the row stuck. The fix is structural — move (4)+(5) to a background job and
demote `processing_status` to a *projection* of the latest job row (see `03_db_redesign.md`).

### 3.2 AI strict-JSON enforcement is partial
- `analyze_resume_content()` is good: forces `response_mime_type="application/json"`,
  retries only on rate-limit-shaped errors, validates numeric `score`/`ats_score`.
- Other JSON-returning features (`generate_learning_path`, `generate_practice_exam`,
  job match scoring in `jobs.py`, interview feedback) call `_configure_and_generate()`
  without the JSON MIME type and rely on heuristic JSON extraction in `_parse_json_response()`.
  Result: schema drift, occasional parse failures, no audit trail.

### 3.3 Background workers are scaffolded but not used
`backend/app/workers/celery_app.py` and `resume_tasks.py` exist, but `resume.py` and
the rest of the API still call Gemini synchronously with `await ...`. So:
- Long Gemini calls block uvicorn workers.
- A single Gemini timeout becomes an HTTP timeout for the user.
- The "stuck `analyzing`" bug is structurally guaranteed because the queue and the
  request lifecycle are the same thing.

### 3.4 Storage layer is split-brain
- Files are saved to local `uploads/` via `save_uploaded_file()`.
- Same file is then optionally pushed to Supabase Storage via `upload_local_file()`.
- The DB stores **extracted text** in `Resume.content` as the source of truth.
- There is no link from a `Resume` row back to either the local file or the Supabase object,
  so re-extraction or re-render later is impossible.

### 3.5 Subscription gating is inconsistent
- `check_feature_access(...)` exists and is used by `analytics.py`.
- Most paid surfaces (`/api/resume/upload`, `/api/resume/analyze/{id}`,
  `/api/resume/cover-letter/{id}`, `/api/resume/enhance/{id}`, etc.) do not apply it.
- Combined with `User.can_upload(): return True`, monetization is currently off.

### 3.6 Upload reads file twice into memory
`backend/app/routes/resume.py::upload_resume` does:
```python
if not validate_file_size(len(await file.read()), max_size_mb=10):
    ...
await file.seek(0)
file_path = save_uploaded_file(file)        # reads again to write to disk
```
Two full-buffer reads per upload. A small number of concurrent 10 MB PDFs will spike RAM
and is the easiest path to OOM on a small instance.

### 3.7 Error handler uses a non-FastAPI envelope
`backend/app/core/error_handlers.py` returns
```json
{ "error": { "code": "...", "message": "...", "status": 500 } }
```
but FastAPI's default `HTTPException` returns `{ "detail": "..." }`. Both shapes are
emitted depending on which handler runs, which is one of the reasons the frontend
contract is so noisy.

---

## 4. Database / model findings

### 4.1 `Resume` table missing structured content
`Resume` only has `content: Text` for the extracted plain text. There is no
`document_json: JSONB` for the structured resume needed for the editor and template engine.

### 4.2 Versioning is broken
- `ResumeVersion` has no `relationship()` and no `cascade='all, delete-orphan'`
  (`backend/app/models/resume.py`). The route compensates with manual delete cleanup.
- `version_number = count() + 1` (`backend/app/routes/resume.py` ~line 731)
  is a textbook race condition.
- `is_current` exists on the column but no code path ever writes it.
- No notion of "this version was tailored for this job description".

### 4.3 Job-aware variants don't exist
The only resume <-> job linkage is `JobApplication.resume_id`. There is no
`JobDescription` table and no `ResumeVariant` (tailored snapshot) entity, so:
- AI enhance loses the JD context as soon as it returns.
- ATS scoring against a JD cannot be re-run later.
- Users cannot maintain multiple tailored resumes per master.

### 4.4 ID type drift across the schema
Some tables use native `UUID`, others use `String` (uuid hex), some use both within
the same row (e.g. FastAPI route filters cast to `str(current_user.id)` because the
target column is `String`). This drift drives the silent-empty-results bugs in
`jobs.py` / `applications.py` / `chat.py` / `watchlist.py` etc.

### 4.5 Missing entities the system clearly needs
- `resume_template` + `resume_theme` (subscription tier already references templates).
- `resume_export` (no record of "user X exported variant Y as PDF at T").
- `ai_run` / `llm_call` (no model/prompt/latency/token/cost ledger; cannot reproduce).
- `credit_ledger` / `usage_event` (current scalar counters on `users` are racy and
  un-auditable).
- `background_jobs` (the `Resume.processing_status` lock-as-queue is the cause of the
  current 409-forever bug).
- `job_description` (JDs are passed as inline strings, lost after each call).

### 4.6 Migrations have drift and partial idempotency
- `000_initial_core_schema.py` calls `Base.metadata.create_all(bind=bind, tables=...)`,
  so the "initial" DDL depends on whatever the model classes look like *at the time of
  apply*. A future model edit silently changes what `000` produces on a fresh DB.
- Migration `002` inlines `sa.Enum(...)` inside `op.create_table`, so a partial-failure
  retry raises `DuplicateObject` for `sessiontype`/`sessionstatus`/`questiontype`/`questiondifficulty`.
- Migrations `003` and `004` have empty `downgrade()` bodies.
- Tests bootstrap with `Base.metadata.create_all`, so test schema diverges from
  migrated production schema (JSON vs JSONB, ENUM vs string, missing `ondelete` clauses).

### 4.7 Schema validation drift
`backend/app/schemas/resume.py` declares `id: int` / `resume_id: int` for several
response models even though the SQLAlchemy columns are UUID. Any caller relying on
`response_model=...` will 500 on serialization.

---

## 5. AI service findings

### 5.1 Single point of strict-JSON rigor (`analyze_resume_content`)
`backend/app/services/gemini_service.py::analyze_resume_content` is the *only* call
that:
- Sets `response_mime_type="application/json"`.
- Validates numeric scores.
- Retries only on rate-limit shapes with backoff (2s / 5s / 10s, max 3).
- Forces the model to a server-side constant (`gemini-2.5-flash`).

Every other AI feature (`generate_learning_path`, `generate_practice_exam`,
`generate_cover_letter`, `match_resume_to_job` in `jobs.py`, interview question
generation/feedback) lacks one or more of: forced JSON MIME, schema validation, retries,
auditable run record.

### 5.2 No auditing
There is no `ai_run` record per call. We do not capture: provider, model, prompt hash,
input/output token counts, latency, cost, error code. Without this, drift, cost spikes,
and quality regressions are invisible.

### 5.3 Cover letter prompt forbids JSON
`generate_cover_letter` is intentionally free-text. That's fine for the *artifact*, but the
**outline** behind it (recipient, opening hook, top 3 selling points, closing CTA) should
be a strict-JSON pre-step so we can: (a) validate it before generating prose, (b) re-style
it without re-asking Gemini, (c) reuse it for the matching job-application story.

### 5.4 PII in logs
- `routes/resume.py` prints `first_300` chars of resume content per analyze request.
- `gemini_service.py` logs preview text at INFO. Both should be reduced to lengths +
  hashes.

---

## 6. ATS scoring findings

`ats_score` today is just a number Gemini returns, validated for being numeric and
clamped to [0, 100]. There is no:
- keyword coverage check (JD <-> resume).
- section completeness check (contact / experience / education / skills present).
- formatting safety check (tables, columns, images, exotic fonts).
- readability / measurability check (verb-led bullets, quantified outcomes).

Result: two analyses of the same resume can produce wildly different ATS scores, and we
cannot explain the score to the user.

---

## 7. Storage / files findings

- Local `uploads/` is the canonical location during a request; the file is deleted at
  the end of `upload_resume` (`cleanup_temp_file`). After that, only the extracted text
  survives.
- Supabase Storage upload is best-effort and not linked from the DB row (no
  `storage_key` column on `Resume`).
- Re-rendering an old upload as a new template is impossible without the original file
  *or* a structured `document_json` to render from. We need at least one of the two —
  the plan picks `document_json` as the canonical store and treats the original file as
  an immutable reference artifact in object storage.

---

## 8. Risks ranked by impact x effort

| Rank | Risk | Impact | Effort to fix | Where to fix |
|------|------|--------|---------------|--------------|
| 1 | "Analysis stuck in `analyzing`" 409 forever | High (blocks core feature) | Medium | Promote to `background_jobs` table, demote `processing_status` to projection. |
| 2 | No `ResumeDocument` JSONB | High (blocks template engine, editor, real export) | Medium | New column + parsing pipeline + Pydantic/Zod schema. |
| 3 | Export is a stub | High (false UX claim) | Medium | New `resume_exports` flow + Chromium/DOCX renderers. |
| 4 | AI strict-JSON only on one call | High (silent quality drift) | Low-Med | Centralize `gemini_json_call(schema, prompt)` helper. |
| 5 | DB id-type and FK drift | Med-High (silent data leaks) | Med | One migration round to UUID-everywhere + FK additions. |
| 6 | Frontend state inconsistent | Med (developer velocity, UX bugs) | Med | Move resume flows to React Query mutations/queries with shared error contract. |
| 7 | In-memory rate limit | Med (prod safety) | Low | Redis-backed limiter (REDIS_URL already set). |
| 8 | PII logging | Med (compliance) | Low | Replace previews with lengths + hashes. |
| 9 | `User.can_upload()` always True | Med (revenue) | Low | Re-enable real check after Phase 0. |
| 10 | Migration chain non-reproducible | Med (deploy safety) | Med | Rewrite `000` as explicit `op.create_table`, add downgrades. |

---

## 9. What this audit unlocks

The remaining design docs in `docs/architecture/` are written **assuming** the Phase 0
fixes happen first, and **assuming** the canonical resume content moves to a structured
`ResumeDocument` JSON. Both are non-negotiable foundations for the template engine,
job-tailored variants, real export, and an ATS scoring engine that can explain itself.

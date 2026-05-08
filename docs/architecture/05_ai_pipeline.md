# AI pipeline redesign (strict JSON, validated, auditable)

This upgrades the current Gemini usage into a production-grade AI system that:

- returns **strict JSON only** for all structured features
- validates every response against Pydantic (server) + Zod (client where relevant)
- retries with **deterministic repair** (bounded attempts)
- records every call in `ai_runs` (model, prompt hash, latency, tokens, cost, status)
- prevents hallucinations by forcing grounding rules and by rejecting schema-invalid outputs

It is designed to fit your existing `backend/app/services/gemini_service.py` without a rewrite:
we wrap it with a single “AI runner” interface that every route/worker uses.

---

## 1. Problem statement (current code)

### 1.1 Only resume analysis is truly strict JSON
`GeminiService.analyze_resume_content()` forces JSON MIME and validates scores.
Other flows (jobs matching, learning path, practice exam, interview flows) rely on heuristic JSON
extraction from plain text, which is not stable over time.

### 1.2 No audit ledger
There is no durable record of:
- which model produced a given analysis/variant
- what prompt version was used
- why a response was rejected
- how much it cost / how many tokens were used

This makes production debugging impossible.

### 1.3 Hallucination risk is unmanaged
Prompts often instruct “don’t invent” but there is no **systematic enforcement**. In production,
hallucinations show up as user trust failures.

---

## 2. Core interface: `ai_runs.call_json(...)`

Every structured AI call becomes:

```python
result = await ai_runner.call_json(
  db=db,
  user_id=current_user.id,
  kind=AIRunKind.RESUME_ANALYZE,
  schema=ResumeAnalysisAI,          # Pydantic model
  prompt=prompt,
  model="gemini-2.5-flash",
  context={
    "resume_id": resume.id,
    "resume_variant_id": variant.id,
    "job_description_id": jd.id,
  },
  max_attempts=2,                   # 1 initial + 1 repair
)
```

Guarantees:
1. Always requests JSON output (`response_mime_type="application/json"`).
2. Parses into a dict.
3. Validates against the Pydantic schema.
4. If validation fails, does at most one repair attempt by sending the validation error back.
5. Writes an `ai_runs` row for every attempt and final status.

---

## 3. Strict JSON enforcement strategy (Gemini)

Gemini supports JSON-mode via `generation_config.response_mime_type`.

Minimum configuration:
- `response_mime_type = "application/json"`
- temperature low (0.2–0.4) for deterministic outputs
- explicit instruction: “Output only JSON. No code fences.”

If the provider returns invalid JSON:
- attempt 1 repair prompt: “You returned invalid JSON. Return valid JSON matching this schema…”
- if still invalid: fail with `AIInvalidResponseError` and mark the job `failed`

---

## 4. Schemas (Pydantic + Zod) and why both exist

- **Server-side Pydantic** is the source of truth: we refuse to persist or return invalid shapes.
- **Client-side Zod** gives immediate UX validation in the editor and prevents corrupt data from
  reaching the server.

Your first schema is `ResumeDocument`:
- `backend/app/schemas/resume_document.py`
- `frontend/lib/resume-document/schema.ts`

Next schemas to define (each becomes a Pydantic model + optional Zod mirror):
- `ResumeParseAI` (parse source text -> ResumeDocument)
- `ResumeTailorAI` (ResumeDocument + JD -> ResumeDocument diff or full doc)
- `ATSScoreAI` (deterministic engine + AI semantics as additive)
- `CoverLetterOutlineAI` (strict JSON outline)
- `JobMatchAI` (JD -> required skills; resume -> coverage evidence)

---

## 5. Hallucination prevention (enforced, not hoped)

### 5.1 Grounding rules baked into every prompt
Every prompt includes a rules header:
- resume text is authoritative
- don’t invent employers/degrees/certs/metrics
- when uncertain: leave field empty and add a `warnings[]` entry

### 5.2 Output must include `warnings[]`
Structured responses include:
- `warnings: string[]`
- `assumptions: string[]`

This makes hallucinations detectable and reviewable.

### 5.3 Diff-based editing for reconstruction/tailoring
Instead of “rewrite the resume” as raw text, the AI outputs either:
- a full `ResumeDocument`, or
- a **patch** (JSON Patch / custom diff) that the server applies to the canonical doc

Diff outputs are easier to audit and safer to apply.

---

## 6. Retry policy (bounded)

- 0 retries for deterministic failures (schema mismatch after repair)
- 2–3 retries for transient failures (429, 502, 503, timeout) with exponential backoff
- idempotency key prevents duplicate consumption of credits on retry

In production: retries happen in the background job worker, not in the HTTP request.

---

## 7. `ai_runs` persistence

Every call writes:
- provider/model
- prompt hash (prompt content hashed with version string)
- request payload (redacted; no PII-heavy raw resume bodies)
- response payload (stored for debugging; optionally encrypted)
- token counts and latency if provider exposes them
- final status and errors

This enables:
- cost analytics
- regressions (prompt version vs quality)
- support tooling (“why did my resume change?”)

---

## 8. Code scaffolding

Implemented minimal scaffolding:
- `backend/app/models/ai_run.py` (table model)

Next code to implement (Phase 0/1):
- `backend/app/services/ai_runner.py` (single interface)
- refactor call sites so every structured feature uses `call_json`

---

## 9. Migration from current code

1. Keep `GeminiService` but stop calling `_configure_and_generate()` directly from routes.
2. Introduce `AIRunner` wrapper that calls Gemini with JSON-mode, validates, logs to DB.
3. Convert endpoints in order of user value:\n
   1) resume parse -> ResumeDocument\n
   2) resume analyze -> ResumeAnalysis\n
   3) resume tailor -> ResumeVariant\n
   4) cover letter outline -> prose\n
   5) job match / interview / practice exam\n


# Frontend state + data layer redesign (React Query + one error contract)

This redesign fixes the core UX and developer-velocity issues caused by:\n
- duplicated `useEffect` fetch logic per page\n
- inconsistent BFF error envelopes (`{detail}`, `{success:false}`, raw text)\n
- per-component “in-flight ref” hacks for de-duping\n

The goal is a production-grade client data layer that supports the resume editor, template preview,\nvariants, exports, and background jobs.

---

## 1. Target principles

1. **React Query is the single cache.** Pages do not call `apiService` directly.\n
2. **One response contract from the BFF.**\n
   - success: `200..299` with `{ data: T }`\n
   - failure: non-2xx with `{ error: { code, message, details? } }`\n
   - no more `HTTP 200 + { success:false }`\n
3. **Every mutation invalidates by query key.**\n
4. **Background jobs are first-class.** Mutations return a `job_id`, queries poll `job.status`.

---

## 2. Concrete file layout (frontend)

Add these modules:

```
frontend/lib/api/
  bffFetch.ts        # fetch wrapper -> typed errors
  errors.ts          # BffError type + helpers

frontend/lib/queries/
  keys.ts            # stable query keys
  resumes.ts         # useResumeHistoryQuery, useResumeQuery, useAnalyzeResumeMutation
  exports.ts         # export job flow
  jobs.ts            # job descriptions + matching
```

The existing `frontend/services/api.ts` can remain during migration, but new work should use\nthis new layer.

---

## 3. Typed BFF errors

```ts
export type BffError = {
  code: string
  message: string
  details?: unknown
}

export class BffRequestError extends Error {
  status: number
  error: BffError
}
```

Components render `error.message` consistently.\n
We stop parsing `detail` vs `error` vs plain text.

---

## 4. React Query: key design

Keys must be stable and composable:

```ts
export const qk = {
  resumeHistory: (page: number, limit: number) => ['resumeHistory', page, limit] as const,
  resume: (resumeId: string) => ['resume', resumeId] as const,
  resumeAnalysis: (resumeId: string) => ['resumeAnalysis', resumeId] as const,
  job: (jobId: string) => ['job', jobId] as const,
  exportJob: (jobId: string) => ['exportJob', jobId] as const,
}
```

---

## 5. Migration path (no big-bang rewrite)

1. Wrap fetches for **resume history** first (highest traffic UI).
2. Replace analyze flows and remove per-page `analyzeInFlightRef` locks.\n
3. Add job polling for exports.\n
4. Then refactor the editor to use query state.

---

## 6. Background jobs and polling

When `POST /api/resume/analyze/:id` becomes async:
- mutation returns `{ job_id }`\n
- UI transitions to “Analyzing…” state\n
- `useJobQuery(job_id)` polls until `status in ('succeeded','failed')`\n
- on success, invalidate `qk.resumeAnalysis(resumeId)` and show results

This removes the current `409` concurrency mess entirely.


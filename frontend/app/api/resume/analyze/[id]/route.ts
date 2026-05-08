import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { resolvedRouteId } from '@/lib/next-route-params'
import { normalizeApiError } from '@/lib/api/errors'

import { fetchBackend } from '@/lib/server/backendBaseUrl'

const ANALYZE_FETCH_TIMEOUT_MS = 180_000
const AI_TEMP_UNAVAILABLE = 'AI temporarily unavailable. Please try again shortly.'
// 429 is *actionable* (quota/billing) — do not squash it into AI_TEMP_UNAVAILABLE.
const UPSTREAM_TRANSIENT_STATUSES = new Set([502, 503, 504])
const ANALYSIS_NOT_FOUND = 'Analysis not found. Please run analysis first.'

/** Latest stored analysis for AI feedback UI. */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const auth = resolveBearer(request) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const resumeId = await resolvedRouteId(context.params)
    if (!resumeId) {
      console.error('[BFF GET /api/resume/analyze] missing resume id', context.params)
      return NextResponse.json({ detail: 'Missing resume id' }, { status: 400 })
    }
    console.info('[BFF GET /api/resume/analyze] proxy resume_id=%s', resumeId)
    const response = await fetchBackend(`/api/resume/analyze/${resumeId}`, {
      method: 'GET',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(ANALYZE_FETCH_TIMEOUT_MS),
    })

    const text = await response.text()
    if (!response.ok) {
      if (response.status === 404) {
        // Do not throw / crash / force callers to handle HTTP errors for "missing analysis".
        // Return a stable envelope instead.
        return NextResponse.json({ success: false, error: ANALYSIS_NOT_FOUND })
      }
      // Keep semantic errors (404 no analysis / unauthorized / validation) as-is,
      // but downgrade transient upstream failures into a stable envelope so the UI never breaks.
      if (UPSTREAM_TRANSIENT_STATUSES.has(response.status)) {
        console.warn(
          '[BFF GET /api/resume/analyze] upstream_unavailable status=%s resume_id=%s',
          response.status,
          resumeId
        )
        return NextResponse.json({ success: false, error: AI_TEMP_UNAVAILABLE })
      }
      console.warn(
        '[BFF GET /api/resume/analyze] backend status=%s resume_id=%s body_preview=%s',
        response.status,
        resumeId,
        text.slice(0, 500)
      )
    }
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error: unknown) {
    console.error('Resume analysis GET error:', error)
    // Defensive: if the upstream request fails (timeout/network), return a safe envelope.
    return NextResponse.json({ success: false, error: AI_TEMP_UNAVAILABLE })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const auth = resolveBearer(req) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { job_description } = body
    const resumeId = await resolvedRouteId(context.params)
    if (!resumeId) {
      console.error('[BFF POST /api/resume/analyze] missing resume id', context.params)
      return NextResponse.json({ detail: 'Missing resume id' }, { status: 400 })
    }
    console.info('[BFF POST /api/resume/analyze] proxy resume_id=%s', resumeId)

    const response = await fetchBackend(`/api/resume/analyze/${resumeId}`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description: job_description,
      }),
      signal: AbortSignal.timeout(ANALYZE_FETCH_TIMEOUT_MS),
    })

    if (!response.ok) {
      // Never leak raw Gemini/backend error bodies to the browser.
      // Convert Gemini rate-limit / upstream failures into a stable envelope.
      if (UPSTREAM_TRANSIENT_STATUSES.has(response.status)) {
        console.warn(
          '[BFF POST /api/resume/analyze] upstream_unavailable status=%s resume_id=%s',
          response.status,
          resumeId
        )
        return NextResponse.json({ success: false, error: AI_TEMP_UNAVAILABLE })
      }
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorBody = await response.json().catch(() => ({}))
        const detail =
          normalizeApiError(errorBody) || 'Failed to analyze resume'
        return NextResponse.json({ detail }, { status: response.status })
      }
      const text = await response.text()
      return NextResponse.json(
        { detail: text || 'Failed to analyze resume' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze resume'
    console.error('Resume analysis POST error:', error)
    // Defensive: if the upstream request fails (timeout/network), return a safe envelope.
    return NextResponse.json({ success: false, error: AI_TEMP_UNAVAILABLE })
  }
}

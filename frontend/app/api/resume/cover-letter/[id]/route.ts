import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { resolvedRouteId } from '@/lib/next-route-params'
import { fetchBackend } from '@/lib/server/backendBaseUrl'
import { normalizeApiError } from '@/lib/api/errors'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authHeader = resolveBearer(request) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const id = await resolvedRouteId(context.params)
    if (!id) {
      return NextResponse.json({ error: 'Missing resume id' }, { status: 400 })
    }

    const backendResponse = await fetchBackend(`/api/resume/${id}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      return NextResponse.json(
        { error: `Backend error: ${errorData}` },
        { status: backendResponse.status }
      )
    }

    const data = (await backendResponse.json()) as Record<string, unknown>

    return NextResponse.json({
      id: data.id,
      filename: data.filename,
      original_content: data.original_content ?? data.content ?? '',
      content: data.content ?? '',
      cover_letter: data.cover_letter ?? '',
      created_at: data.created_at ?? data.upload_date ?? '',
    })
  } catch (error) {
    console.error('Cover letter fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cover letter' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const job_description =
      typeof body.job_description === 'string' ? body.job_description : ''

    if (job_description.trim().length < 40) {
      return NextResponse.json(
        {
          error:
            'Job description is required (paste a full posting or a substantial excerpt).',
        },
        { status: 400 }
      )
    }

    const authHeader = resolveBearer(request) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const id = await resolvedRouteId(context.params)
    if (!id) {
      return NextResponse.json({ error: 'Missing resume id' }, { status: 400 })
    }

    const backendResponse = await fetchBackend(`/api/resume/cover-letter/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        job_description: job_description.trim(),
      }),
    })

    if (!backendResponse.ok) {
      const raw = await backendResponse.text()
      let payload: unknown = raw
      try {
        payload = JSON.parse(raw) as unknown
      } catch {
        /* keep raw string */
      }
      const detail =
        typeof payload === 'object' && payload !== null
          ? normalizeApiError(payload)
          : raw
      return NextResponse.json(
        { detail: detail || 'Cover letter request failed' },
        { status: backendResponse.status }
      )
    }

    const data = (await backendResponse.json()) as {
      cover_letter?: string
      content?: string
    }

    const letter = (data.cover_letter ?? data.content ?? '').trim()
    if (!letter) {
      return NextResponse.json(
        { detail: 'Cover letter generation produced no text.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ cover_letter: letter })
  } catch (error) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json(
      { detail: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}

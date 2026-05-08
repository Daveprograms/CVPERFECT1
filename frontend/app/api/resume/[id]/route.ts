import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { resolvedRouteId } from '@/lib/next-route-params'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

/** Proxies GET /api/resume/:id → FastAPI GET /api/resume/:id */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const auth = resolveBearer(request) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const id = await resolvedRouteId(context.params)
    if (!id) {
      return NextResponse.json({ detail: 'Missing resume id' }, { status: 400 })
    }

    const response = await fetchBackend(`/api/resume/${id}`, {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (e) {
    console.error('resume get proxy:', e)
    return NextResponse.json({ detail: 'Failed to load resume' }, { status: 500 })
  }
}

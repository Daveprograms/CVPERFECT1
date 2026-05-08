import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'

import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function GET(request: NextRequest) {
  try {
    const auth = resolveBearer(request) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    const response = await fetchBackend(
      `/api/resume/feedback-history?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
        },
      }
    )

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (e) {
    console.error('feedback-history proxy:', e)
    return NextResponse.json(
      { detail: 'Failed to load feedback history' },
      { status: 500 }
    )
  }
}

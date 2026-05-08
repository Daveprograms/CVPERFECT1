import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'

import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function GET(request: NextRequest) {
  try {
    const auth = resolveBearer(request) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('time_range') || 'month'
    const qs = new URLSearchParams({ time_range: timeRange }).toString()

    const response = await fetchBackend(`/api/analytics/user-insights?${qs}`, {
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
    console.error('analytics user-insights proxy:', e)
    return NextResponse.json({ detail: 'Failed to load analytics' }, { status: 500 })
  }
}

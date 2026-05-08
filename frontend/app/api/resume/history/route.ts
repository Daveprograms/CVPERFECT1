import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'

import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    const authHeader = resolveBearer(request) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    const response = await fetchBackend(
      `/api/resume/history?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: authHeader,
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
  } catch (error) {
    console.error('Error fetching resume history:', error)
    return NextResponse.json(
      { detail: 'Failed to fetch resume history' },
      { status: 500 }
    )
  }
} 
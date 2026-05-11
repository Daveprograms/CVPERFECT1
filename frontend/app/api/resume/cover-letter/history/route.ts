import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthHeader } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = getServerAuthHeader(request)
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/resume/cover-letter/history`
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: { Authorization: authHeader }
    })

    const data = await backendResponse.json().catch(() => [])
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error('Cover letter history fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch cover letter history' }, { status: 500 })
  }
}

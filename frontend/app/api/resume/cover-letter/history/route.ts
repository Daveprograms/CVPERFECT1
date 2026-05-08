import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/cover-letter/history`
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
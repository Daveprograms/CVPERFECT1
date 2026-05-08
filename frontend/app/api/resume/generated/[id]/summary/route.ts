import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getToken(request: NextRequest): string | null {
  const cookieStore = cookies()
  const cookieToken = cookieStore.get('auth_token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '') || ''
  return headerToken || cookieToken || null
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.text()
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/generated/${params.id}/summary`
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Generated resume summary proxy error:', error)
    return NextResponse.json({ detail: 'Failed to generate summary' }, { status: 500 })
  }
}

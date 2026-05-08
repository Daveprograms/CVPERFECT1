import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()

    if (!body.resume_id) {
      return new NextResponse(JSON.stringify({ detail: 'resume_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/resume/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fix resume')
      } else {
        const text = await response.text()
        throw new Error(text || 'Failed to fix resume')
      }
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume fix error:', error)
    return new NextResponse(JSON.stringify({ detail: error.message || 'Failed to fix resume' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

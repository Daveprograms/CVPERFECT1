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

    const { content, job_description } = await req.json()
    if (!content) {
      return new NextResponse(JSON.stringify({ detail: 'Resume content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/resume/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content, job_description })
    })

    if (!response.ok) {
      throw new Error('Failed to score resume')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume scoring error:', error)
    return new NextResponse(JSON.stringify({ detail: error.message || 'Failed to score resume' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
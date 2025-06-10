import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/resume/history`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch resume history')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume history error:', error)
    return new NextResponse(JSON.stringify({ detail: error.message || 'Failed to fetch resume history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
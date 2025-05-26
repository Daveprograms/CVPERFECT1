import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { content, job_description } = await req.json()
    if (!content) {
      return new NextResponse('Resume content is required', { status: 400 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/resume/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({ content, job_description })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze resume')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
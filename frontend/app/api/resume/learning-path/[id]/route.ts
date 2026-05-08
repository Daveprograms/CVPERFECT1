import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { job_description } = body
    
    if (!job_description) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    const authHeader = resolveBearer(request) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Call backend API
    const backendResponse = await fetchBackend(`/api/resume/learning-path/${params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ job_description })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      return NextResponse.json(
        { error: `Backend error: ${errorData}` },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Learning path generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    )
  }
} 
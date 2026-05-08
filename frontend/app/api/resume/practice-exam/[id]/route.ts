import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = resolveBearer(request) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const backendResponse = await fetchBackend(`/api/resume/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      return NextResponse.json(
        { error: `Backend error: ${errorData}` },
        { status: backendResponse.status }
      )
    }

    const resumeData = await backendResponse.json()
    
    // Return the resume data with practice exam info
    return NextResponse.json({
      id: resumeData.id,
      filename: resumeData.filename,
      original_content: resumeData.content,
      practice_exam: resumeData.practice_exam,
      created_at: resumeData.created_at,
      updated_at: resumeData.updated_at
    })

  } catch (error) {
    console.error('Practice exam retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve practice exam' },
      { status: 500 }
    )
  }
}

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const backendResponse = await fetchBackend(`/api/resume/practice-exam/${params.id}`, {
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
    console.error('Practice exam generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate practice exam' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthHeader } from '@/lib/server-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = getServerAuthHeader(request)
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/resume/${params.id}`
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader }
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      return NextResponse.json({ error: `Backend error: ${errorData}` }, { status: backendResponse.status })
    }

    const resumeData = await backendResponse.json()
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
    return NextResponse.json({ error: 'Failed to retrieve practice exam' }, { status: 500 })
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
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
    }

    const authHeader = getServerAuthHeader(request)
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/resume/practice-exam/${params.id}`
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ job_description })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      return NextResponse.json({ error: `Backend error: ${errorData}` }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Practice exam generation error:', error)
    return NextResponse.json({ error: 'Failed to generate practice exam' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🧪 Practice exam GET API called for resume:', params.id)
  
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization') || ''
    console.log('🔐 Authorization header received:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NONE')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Call backend API to get resume with practice exam
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/${params.id}`
    console.log('🌐 Calling backend:', backendUrl)
    
    const backendResponse = await fetch(backendUrl, {
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
  console.log('🧪 Practice exam API called for resume:', params.id)
  
  try {
    const body = await request.json()
    const { job_description } = body
    
    console.log('📝 Request body received:', { 
      hasJobDescription: !!job_description, 
      jobDescLength: job_description?.length || 0 
    })
    
    if (!job_description) {
      console.log('❌ Job description missing in request body')
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization') || ''
    console.log('🔐 Authorization header received:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NONE')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Call backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/practice-exam/${params.id}`
    console.log('🌐 Calling backend:', backendUrl)
    
    const backendResponse = await fetch(backendUrl, {
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
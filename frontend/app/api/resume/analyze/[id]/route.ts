import { NextResponse, NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return new NextResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { job_description } = body
    const resumeId = params.id

    console.log('🔍 Analyzing resume:', { resumeId, hasJobDescription: !!job_description })

    // Call backend analyze endpoint with resume ID
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/resume/analyze/${resumeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_description: job_description
      })
    })

    console.log('🔍 Backend analyze response status:', response.status)

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        console.log('❌ Backend analyze error:', error)
        throw new Error(error.detail || 'Failed to analyze resume')
      } else {
        const text = await response.text()
        console.log('❌ Backend analyze text error:', text)
        throw new Error(text || 'Failed to analyze resume')
      }
    }

    const data = await response.json()
    console.log('✅ Analyze successful')
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ Resume analysis error:', error)
    return new NextResponse(JSON.stringify({ detail: error.message || 'Failed to analyze resume' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
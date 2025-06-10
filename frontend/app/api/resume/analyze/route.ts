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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const jobDescription = formData.get('job_description') as string

    if (!file) {
      return new NextResponse(JSON.stringify({ detail: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create new FormData for backend request
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    if (jobDescription) {
      backendFormData.append('job_description', jobDescription)
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/resume/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: backendFormData
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to analyze resume')
      } else {
        const text = await response.text()
        throw new Error(text || 'Failed to analyze resume')
      }
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return new NextResponse(JSON.stringify({ detail: error.message || 'Failed to analyze resume' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 
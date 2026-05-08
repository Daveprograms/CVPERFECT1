export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('📖 Fetching cover letter for resume:', params.id)

  try {
    const cookieStore = cookies()
    const cookieToken = cookieStore.get('auth_token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const token = headerToken || cookieToken || ''
    const authHeader = token ? `Bearer ${token}` : ''
    console.log('🔐 Authorization header received:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NONE')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Call backend API to get latest generated cover letter for the resume
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/cover-letter/${params.id}`
    console.log('🌐 Calling backend:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
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

    const data = await backendResponse.json()

    return NextResponse.json({
      id: data.id,
      resume_id: data.resume_id,
      filename: data.filename,
      original_content: null,
      cover_letter: data.cover_letter,
      created_at: data.created_at
    })

  } catch (error) {
    console.error('Cover letter fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cover letter' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('📝 Cover letter API called for resume:', params.id)

  try {
    const cookieStore = cookies()
    const cookieToken = cookieStore.get('auth_token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const token = headerToken || cookieToken || ''
    const body = await request.json()
    const { job_description } = body

    if (!job_description) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    // Get auth token from request headers
    const authHeader = token ? `Bearer ${token}` : ''
    console.log('🔐 Authorization header received:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NONE')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Call backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/cover-letter/${params.id}`
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
    console.error('Cover letter generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthHeader } from '@/lib/server-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🗑️ Delete resume API called for resume:', params.id)

  try {
    const authHeader = getServerAuthHeader(request)

    if (!authHeader) {
      console.log('❌ Missing or invalid authorization')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Call backend API to delete resume
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/resume/${params.id}`
    console.log('🌐 Calling backend:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
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

    console.log('✅ Resume deleted successfully')
    return NextResponse.json({ success: true, message: 'Resume deleted successfully' })

  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    )
  }
} 
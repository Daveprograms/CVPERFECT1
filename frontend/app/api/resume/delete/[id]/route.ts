import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🗑️ Delete resume API called for resume:', params.id)
  
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
    
    // Call backend API to delete resume
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/${params.id}`
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
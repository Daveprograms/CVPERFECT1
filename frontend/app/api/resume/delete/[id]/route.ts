import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function DELETE(
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

    console.log('🌐 Calling backend:', `/api/resume/${params.id}`)

    const backendResponse = await fetchBackend(`/api/resume/${params.id}`, {
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
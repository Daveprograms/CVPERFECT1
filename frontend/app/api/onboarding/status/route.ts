import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get the auth token from Authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401 }
      )
    }

    // Get onboarding status from backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/onboarding/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!backendResponse.ok) {
      return new NextResponse(
        JSON.stringify({ message: 'Failed to get onboarding status' }),
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ Onboarding status error:', error)
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred while checking onboarding status' }),
      { status: 500 }
    )
  }
} 
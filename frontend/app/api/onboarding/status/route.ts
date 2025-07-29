import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    // Get the auth token
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

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
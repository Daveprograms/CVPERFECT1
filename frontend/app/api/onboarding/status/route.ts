import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

const BACKEND_FETCH_TIMEOUT_MS = 30_000

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
    const backendResponse = await fetchBackend('/api/onboarding/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS),
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
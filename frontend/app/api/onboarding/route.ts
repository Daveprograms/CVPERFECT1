import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

/** Backend uses custom handlers: { error: { message } } not always { detail }. */
function messageFromBackendError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Failed to save onboarding data'
  const d = data as Record<string, unknown>
  if (typeof d.detail === 'string') return d.detail
  const nested = d.error as Record<string, unknown> | undefined
  if (nested && typeof nested.message === 'string') return nested.message
  if (typeof d.message === 'string') return d.message
  return 'Failed to save onboarding data'
}

export async function POST(req: Request) {
  try {
    const onboardingData = await req.json()
    
    console.log('📝 Onboarding data received:', onboardingData)

    // Get the auth token
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401 }
      )
    }

    // Send data to backend
    const backendResponse = await fetchBackend('/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(onboardingData)
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      console.error('❌ Backend onboarding error:', errorData)
      const msg = messageFromBackendError(errorData)
      return new NextResponse(JSON.stringify({ message: msg, detail: msg }), {
        status: backendResponse.status,
      })
    }

    const result = await backendResponse.json()
    console.log('✅ Onboarding completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result
    })

  } catch (error: any) {
    console.error('❌ Onboarding error:', error)
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred during onboarding' }),
      { status: 500 }
    )
  }
} 
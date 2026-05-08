import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend, getBackendBaseUrl } from '@/lib/server/backendBaseUrl'

export async function GET() {
  const backendUrl = getBackendBaseUrl()
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('🔐 Frontend auth check - calling backend validation...')

    const response = await fetchBackend('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return new NextResponse(JSON.stringify({ message: 'Authentication failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    console.log('✅ Backend auth validation successful')

    return NextResponse.json({
      user: data,
      message: 'Authenticated',
    })
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    const detail =
      'Could not reach the Python API. Set BACKEND_URL in frontend/.env.local to the same host/port as uvicorn (default http://127.0.0.1:8000).'
    const payload: Record<string, unknown> = {
      message: 'Backend unreachable',
      detail,
    }
    if (process.env.NODE_ENV === 'development') {
      payload.backendUrl = backendUrl
    }
    return new NextResponse(JSON.stringify(payload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

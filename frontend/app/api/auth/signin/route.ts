import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ message: 'Email and password are required' }),
        { status: 400 }
      )
    }

    console.log('🔐 Frontend signin - calling backend authentication...')

    // Call backend authentication endpoint
    const response = await fetchBackend('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json().catch(() => ({} as any))

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({
          message:
            data?.detail ||
            data?.error?.message ||
            data?.message ||
            'Authentication failed',
        }),
        { status: response.status }
      )
    }

    if (!data?.token) {
      return new NextResponse(
        JSON.stringify({
          message:
            'Backend did not return an auth token. Check backend /api/auth/login response.',
        }),
        { status: 502 }
      )
    }

    const cookieStore = cookies()
    cookieStore.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return new NextResponse(
      JSON.stringify({
        redirectUrl: '/dashboard',
        user: data.user,
        message: data.message || 'Sign in successful',
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Sign in failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred during sign in' }),
      { status: 500 }
    )
  }
} 
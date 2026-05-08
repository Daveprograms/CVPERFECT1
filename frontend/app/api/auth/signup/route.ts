import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json()
    
    if (!email || !password || !fullName) {
      return new NextResponse(
        JSON.stringify({ message: 'Email, password, and full name are required' }),
        { status: 400 }
      )
    }

    console.log('📝 Frontend signup - calling backend registration...')

    // Call backend registration endpoint
    const response = await fetchBackend('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ message: data.detail || 'Registration failed' }),
        { status: response.status }
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

    return NextResponse.json({
      user: data.user,
      message: data.message || 'Account created successfully',
    })
  } catch (error: any) {
    console.error('❌ Signup failed:', error)
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Signup failed' }),
      { status: 500 }
    )
  }
} 
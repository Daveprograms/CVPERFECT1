import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: Replace with actual authentication logic
    // For now, we'll accept any email/password
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ message: 'Email and password are required' }),
        { status: 400 }
      )
    }

    // Set auth token cookie
    const cookieStore = cookies()
    cookieStore.set('auth_token', 'dummy_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Return success response with redirect URL
    return new NextResponse(
      JSON.stringify({ redirectUrl: '/dashboard' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Sign in failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred during sign in' }),
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

    console.log('🔐 Frontend signin - using test authentication...')

    // For testing, accept any email/password and return a test token
    const testToken = 'test_token_' + Math.random().toString(36).substring(7)
    
    console.log('✅ Test signin successful:', { email, testToken })

    // Set the test auth token cookie
    const cookieStore = cookies()
    cookieStore.set('auth_token', testToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Return success response with redirect URL
    return new NextResponse(
      JSON.stringify({ 
        redirectUrl: '/dashboard',
        user: {
          id: '1',
          email: email,
          fullName: 'Test User',
          subscription_type: 'PRO'
        },
        message: 'Sign in successful'
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
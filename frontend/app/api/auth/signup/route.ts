import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json()
    
    if (!email || !password || !fullName) {
      return new NextResponse(
        JSON.stringify({ message: 'Email, password, and full name are required' }),
        { status: 400 }
      )
    }

    console.log('📝 Signup attempt:', { email, fullName })

    // For testing, create a test user
    const testToken = 'test_token_' + Math.random().toString(36).substring(7)
    
    const user = {
      id: '1',
      email: email,
      full_name: fullName,
      subscription_type: 'PRO',
      subscription_status: 'active'
    }

    // Set the auth token cookie
    const cookieStore = cookies()
    cookieStore.set('auth_token', testToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })

    console.log('✅ Signup successful:', { email, testToken })

    return NextResponse.json({
      user,
      message: 'Account created successfully'
    })
  } catch (error: any) {
    console.error('❌ Signup failed:', error)
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Signup failed' }),
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: Replace with actual authentication logic
    // For now, we'll just check if the email and password are provided
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Mock successful authentication
    const user = {
      id: '1',
      email: email,
      full_name: 'Test User',
      subscription: {
        status: 'active',
        plan: 'basic',
        expiresAt: null
      }
    }

    // Generate a mock token
    const token = 'mock_token_' + Math.random().toString(36).substring(7)

    // Set the token cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return NextResponse.json({ user, token })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 
export const dynamic = 'force-dynamic'

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

    console.log('🔐 Frontend signin - calling backend authentication...')

    // Call backend authentication endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ message: data.detail || 'Authentication failed' }),
        { status: response.status }
      )
    }

    console.log('✅ Backend authentication successful')

    // Set the auth token cookie (for server-side routes)
    const cookieStore = cookies()
    cookieStore.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Return success response with token for client-side storage
    return new NextResponse(
      JSON.stringify({ 
        redirectUrl: '/dashboard',
        token: data.token,
        user: data.user,
        message: data.message || 'Sign in successful'
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
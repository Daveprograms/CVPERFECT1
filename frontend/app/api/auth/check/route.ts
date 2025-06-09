import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // TODO: Replace with actual token verification
    // For now, we'll just check if the token exists
    const user = {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      subscription: {
        status: 'active',
        plan: 'basic',
        expiresAt: null
      }
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 
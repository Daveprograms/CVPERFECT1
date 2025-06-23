import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401 }
      )
    }

    console.log('🔐 Auth check - token found:', token.substring(0, 20) + '...')

    // For now, return test user data
    // In production, this would validate the token with Firebase/backend
    const user = {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      subscription_type: 'PRO',
      subscription_status: 'active'
    }

    return NextResponse.json({ 
      user,
      message: 'Authenticated' 
    })
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Authentication check failed' }),
      { status: 500 }
    )
  }
} 
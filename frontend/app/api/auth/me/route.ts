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

    console.log('🔐 Frontend auth check - calling backend validation...')

    // Call backend to validate token and get user info
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication failed' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Backend auth validation successful')

    return NextResponse.json({ 
      user: data,
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
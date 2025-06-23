import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(
        JSON.stringify({ authenticated: false, message: 'Not authenticated' }),
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      authenticated: true,
      message: 'Authenticated' 
    })
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    return new NextResponse(
      JSON.stringify({ authenticated: false, message: 'Authentication check failed' }),
      { status: 500 }
    )
  }
} 
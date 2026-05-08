export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Clear all auth-related cookies
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    console.log('🧹 Auth state cleared')

    return NextResponse.json({ 
      message: 'Auth state cleared successfully' 
    })
  } catch (error) {
    console.error('❌ Clear auth failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Failed to clear auth state' }),
      { status: 500 }
    )
  }
} 
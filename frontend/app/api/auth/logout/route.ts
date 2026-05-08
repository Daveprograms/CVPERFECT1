export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Clear the auth token cookie
    cookieStore.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    console.log('✅ User logged out successfully')

    return NextResponse.json({ 
      message: 'Logged out successfully' 
    })
  } catch (error) {
    console.error('❌ Logout failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Logout failed' }),
      { status: 500 }
    )
  }
} 
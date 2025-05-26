import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to sign out')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Sign out error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
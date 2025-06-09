import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // For now, return a default free subscription
    // In a real application, you would fetch this from your database
    return NextResponse.json({
      subscription_type: 'free',
      status: 'active',
      expires_at: null
    })
  } catch (error) {
    console.error('Error in subscription route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
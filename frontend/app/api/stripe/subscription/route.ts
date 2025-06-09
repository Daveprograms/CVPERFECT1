import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/stripe/subscription`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch subscription')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Subscription error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { action } = await req.json()
    if (!action) {
      return new NextResponse('Action is required', { status: 400 })
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/stripe/subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ action })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update subscription')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Subscription update error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { price_id } = await req.json()
    if (!price_id) {
      return new NextResponse('Price ID is required', { status: 400 })
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/stripe/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ price_id })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
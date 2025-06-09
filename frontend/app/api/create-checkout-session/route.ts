import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const PRICE_IDS = {
  one_time: process.env.STRIPE_ONE_TIME_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { plan, userId } = await req.json()

    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return new NextResponse('Invalid plan', { status: 400 })
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: plan === 'pro' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
      customer_email: session.user.email!,
      metadata: {
        userId,
        plan,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
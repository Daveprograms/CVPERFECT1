import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return new NextResponse('No signature', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new NextResponse('Webhook signature verification failed', { status: 400 })
    }

    // Forward the event to the backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/stripe/webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': signature
        },
        body
      }
    )

    if (!response.ok) {
      throw new Error('Failed to process webhook on backend')
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
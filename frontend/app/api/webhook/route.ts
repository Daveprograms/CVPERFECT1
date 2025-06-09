import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new NextResponse('Webhook signature verification failed', { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, plan } = session.metadata!

        // Here you would update your database with the subscription information
        // For example:
        // await db.user.update({
        //   where: { id: userId },
        //   data: {
        //     subscriptionType: plan,
        //     subscriptionStatus: 'active',
        //     stripeCustomerId: session.customer as string,
        //     subscriptionEndDate: plan === 'pro' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        //   },
        // })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Here you would update your database to mark the subscription as inactive
        // For example:
        // await db.user.update({
        //   where: { stripeCustomerId: customerId },
        //   data: {
        //     subscriptionStatus: 'inactive',
        //   },
        // })

        break
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
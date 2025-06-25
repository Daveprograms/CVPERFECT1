import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Stripe checkout disabled for now - using custom auth system
    return NextResponse.json({ 
      error: 'Stripe integration temporarily disabled'
    }, { status: 503 })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
} 
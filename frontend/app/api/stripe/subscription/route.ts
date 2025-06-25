import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Stripe subscription check disabled for now - using custom auth system
    return NextResponse.json({ 
      subscription: { status: 'active', tier: 'free' }
    })
  } catch (error: any) {
    console.error('Stripe subscription error:', error)
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Stripe subscription creation disabled for now
    return NextResponse.json({ 
      error: 'Stripe integration temporarily disabled'
    }, { status: 503 })
  } catch (error: any) {
    console.error('Stripe subscription creation error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
} 
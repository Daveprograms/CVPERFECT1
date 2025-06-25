import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Subscription check disabled for now - using custom auth system
    return NextResponse.json({ 
      subscription: { status: 'active', tier: 'free' }
    })
  } catch (error: any) {
    console.error('Subscription check failed:', error)
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Promo code validation disabled for now - using custom auth system
    return NextResponse.json({ 
      valid: false,
      message: 'Promo code validation temporarily disabled'
    })
  } catch (error: any) {
    console.error('Promo validation error:', error)
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 })
  }
} 
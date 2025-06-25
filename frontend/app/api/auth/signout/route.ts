import { NextResponse } from 'next/server'

export async function POST() {
  try {
                                                                          // Custom auth system - token is managed on client side
    // Server just confirms the signout request
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Sign out error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
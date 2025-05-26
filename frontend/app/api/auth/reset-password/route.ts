import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return new NextResponse('Email is required', { status: 400 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json()
    if (!email || !password || !fullName) {
      return new NextResponse('Email, password, and full name are required', { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Sign up error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
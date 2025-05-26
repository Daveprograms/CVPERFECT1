import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return new NextResponse('Message is required', { status: 400 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error('Failed to get chat response')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Chat error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
} 
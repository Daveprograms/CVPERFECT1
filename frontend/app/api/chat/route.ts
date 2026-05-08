import { NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(req: Request) {
  try {
    const authHeader = resolveBearer(req) || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return new NextResponse('Message is required', { status: 400 })
    }

    const response = await fetchBackend('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
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
import { NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/server/backendBaseUrl'
import { errorMessageFromResponse } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const response = await fetchBackend('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const msg = await errorMessageFromResponse(response)
      return NextResponse.json({ success: false, error: msg }, { status: response.status })
    }

    const data = await response.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    const message =
      error instanceof Error ? error.message : 'Password reset failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/server/backendBaseUrl'
import { errorMessageFromResponse } from '@/lib/api/errors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      )
    }

    const response = await fetchBackend('/api/auth/confirm-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (!response.ok) {
      const msg = await errorMessageFromResponse(response)
      return NextResponse.json({ success: false, error: msg }, { status: response.status })
    }

    const data = await response.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Confirm password reset error:', error)
    const message =
      error instanceof Error ? error.message : 'Could not reset password'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

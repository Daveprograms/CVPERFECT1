import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Acknowledges snapshot generation for an authenticated user.
 * Dedicated backend tracking can be wired here later.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    await req.json().catch(() => ({}))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Analytics snapshot error:', error)
    return NextResponse.json({ detail: 'Failed to record snapshot' }, { status: 500 })
  }
}

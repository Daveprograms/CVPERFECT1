/**
 * Server-side auth helper for Next.js API routes.
 * Reads the token from the Authorization header first, then falls back
 * to the auth_token cookie — so routes work whether the client sends a
 * header (XHR/fetch) or only a cookie (server-side / fresh session).
 */
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export function getServerToken(request: NextRequest): string | null {
  // 1. Authorization header (sent by client-side fetch calls)
  const header = request.headers.get('authorization')
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }

  // 2. Cookie fallback (persists across page reloads / new tabs)
  const cookieStore = cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export function getServerAuthHeader(request: NextRequest): string {
  const token = getServerToken(request)
  return token ? `Bearer ${token}` : ''
}

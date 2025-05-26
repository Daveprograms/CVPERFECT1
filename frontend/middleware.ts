import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/reset-password'
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Check if the path is public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // If no token and trying to access protected route, redirect to signin
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/history/:path*',
    '/billing/:path*',
    '/auth/:path*'
  ]
} 
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/onboarding',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/check',
  '/api/auth/clear',
  '/api/onboarding',
  '/api/onboarding/status',
  '/about',
  '/pricing',
  '/features',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies'
]

// Paths that should redirect to dashboard if already authenticated
const authOnlyPaths = [
  '/auth/signin',
  '/auth/signup',
  '/login'
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  console.log('🔒 Middleware check:', { pathname, hasToken: !!token })

  // Check if the path is public (no auth required)
  if (publicPaths.includes(pathname)) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && authOnlyPaths.includes(pathname)) {
      console.log('🔄 Authenticated user accessing auth page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // For protected routes, check if user is authenticated
  if (!token) {
    console.log('🚫 No token found, redirecting to signin')
    const signinUrl = new URL('/auth/signin', request.url)
    signinUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signinUrl)
  }

  console.log('✅ Token found, allowing access')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 
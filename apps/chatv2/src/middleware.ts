import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/api/auth', '/getting-started']

// List of paths that should redirect to getting-started if not completed onboarding
const onboardingPaths = ['/dashboard', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip middleware for static files and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/') ||
    pathname.includes('favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/auth/')
  ) {
    console.log('Skipping middleware for static/api path:', pathname)
    return NextResponse.next()
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: 'next-auth.session-token'
    })

    // Add debug logging in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Production auth debug:', {
        path: pathname,
        hasToken: !!token,
        cookies: request.cookies.getAll(),
        headers: Object.fromEntries(request.headers.entries())
      })
    }

    console.log('Auth token status:', token ? 'present' : 'missing', 'for path:', pathname)

    // Allow root path to be handled by page.tsx
    if (pathname === '/') {
      return NextResponse.next()
    }

    // Handle non-public paths
    if (!publicPaths.includes(pathname)) {
      if (!token) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = request.cookies.get('onboarding_complete')?.value === 'true'

    // Special handling for getting-started page
    if (pathname === '/getting-started') {
      if (!token) {
        console.log('Unauthenticated user on getting-started, redirecting to login')
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    // If on login page and already authenticated, redirect to appropriate page
    if (pathname === '/login' && token) {
      console.log('Authenticated user on login page, redirecting to appropriate page')
      const redirectUrl = hasCompletedOnboarding ? '/' : '/getting-started'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Redirect authenticated users who haven't completed onboarding
    if (token && !hasCompletedOnboarding && onboardingPaths.includes(pathname)) {
      console.log('User needs to complete onboarding, redirecting to getting-started')
      return NextResponse.redirect(new URL('/getting-started', request.url))
    }

    console.log('Proceeding with request for path:', pathname)
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - auth (authentication routes)
     */
    '/((?!_next/static|_next/image|api|auth).*)',
  ],
} 
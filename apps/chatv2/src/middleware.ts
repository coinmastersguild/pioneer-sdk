import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/api/auth']

// List of paths that should redirect to getting-started if not completed onboarding
const onboardingPaths = ['/', '/dashboard', '/settings']

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
    })

    console.log('Auth token status:', token ? 'present' : 'missing', 'for path:', pathname)

    // Check if user has completed onboarding
    const hasCompletedOnboarding = request.cookies.get('onboarding_complete')?.value === 'true'

    // If on login page and already authenticated, redirect to appropriate page
    if (pathname === '/login' && token) {
      console.log('Authenticated user on login page, redirecting to appropriate page')
      const redirectUrl = hasCompletedOnboarding ? '/' : '/getting-started'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // If on getting-started page and authenticated, allow access
    if (pathname === '/getting-started' && token) {
      console.log('Authenticated user accessing getting-started page')
      return NextResponse.next()
    }

    // If no token and not on a public path, redirect to login
    if (!token && !publicPaths.some(path => pathname.startsWith(path))) {
      const loginUrl = new URL('/login', request.url)
      // Only set callback for non-public paths and not getting-started
      if (pathname !== '/' && pathname !== '/getting-started') {
        loginUrl.searchParams.set('callbackUrl', pathname + search)
      }
      console.log('Unauthenticated user, redirecting to login:', loginUrl.toString())
      return NextResponse.redirect(loginUrl)
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
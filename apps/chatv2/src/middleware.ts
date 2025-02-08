import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/api/auth', '/auth', '/auth/error']

// List of paths that should redirect to dashboard if authenticated
const authPaths = ['/login', '/signup']

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
    return NextResponse.next()
  }

  // Check if the current path is the login page
  const isLoginPage = pathname === '/login'

  // If it's the login page, allow access
  if (isLoginPage) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    })

    // Check if user has completed onboarding
    const hasCompletedOnboarding = request.cookies.get('onboarding_complete')?.value === 'true'

    // If no token and not on a public path, redirect to login
    if (!token && !publicPaths.some(path => pathname.startsWith(path))) {
      const loginUrl = new URL('/login', request.url)
      
      // Only set callback for non-public paths
      if (!publicPaths.includes(pathname)) {
        const callbackUrl = `${pathname}${search}`
        loginUrl.searchParams.set('callbackUrl', callbackUrl)
      }
      
      console.log('Redirecting to login with URL:', loginUrl.toString())
      return NextResponse.redirect(loginUrl)
    }

    // If has token and on login/signup, redirect to getting-started
    if (token && publicPaths.includes(pathname)) {
      console.log('Authenticated user on public path, redirecting to getting-started')
      return NextResponse.redirect(new URL('/getting-started', request.url))
    }

    // Redirect authenticated users who haven't completed onboarding
    if (token && !hasCompletedOnboarding && onboardingPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/getting-started', request.url))
    }

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
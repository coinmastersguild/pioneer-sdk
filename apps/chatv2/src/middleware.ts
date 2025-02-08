import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/api/auth']

// List of paths that should redirect to dashboard if authenticated
const authPaths = ['/login', '/signup']

// List of paths that should redirect to getting-started if not completed onboarding
const onboardingPaths = ['/', '/dashboard', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip middleware for static files and api routes (except auth)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.startsWith('/api/') ||
    pathname.includes('/favicon.') ||
    pathname.includes('.')
  ) {
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
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If has token and trying to access auth pages, redirect to home
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirect authenticated users who haven't completed onboarding
    if (token && !hasCompletedOnboarding && onboardingPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/getting-started', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',],
} 
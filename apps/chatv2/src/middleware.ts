import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/forgot_password', '/reset_password', '/auth/error']

// List of paths that should redirect to dashboard if authenticated
const authPaths = ['/login', '/signup']

// List of paths that should redirect to getting-started if not completed onboarding
const onboardingPaths = ['/', '/dashboard', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })

  // Check if user has completed onboarding
  const hasCompletedOnboarding = request.cookies.get('onboarding_complete')?.value === 'true'

  // Redirect authenticated users trying to access auth pages to getting-started
  if (token && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/getting-started', request.url))
  }

  // Redirect unauthenticated users trying to access protected pages to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users who haven't completed onboarding
  if (token && !hasCompletedOnboarding && onboardingPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/getting-started', request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 
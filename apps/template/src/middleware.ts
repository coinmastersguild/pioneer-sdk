import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// List of paths that are accessible without authentication
const publicPaths = ['/login', '/signup', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Check if the path is public
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get the token from the request
  const token = await getToken({ req: request })

  // If there's no token and the path isn't public, redirect to login
  if (!token && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 
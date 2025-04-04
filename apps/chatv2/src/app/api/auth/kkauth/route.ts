import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const AUTH_SECRET = process.env.AUTH_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { username, address, queryKey } = await request.json()
    //console.log('KeepKey auth request:', { username, address, queryKey })
    
    if (!username || !queryKey) {
      //console.log('❌ Missing required auth data')
      return NextResponse.json(
        { error: 'Missing required authentication data' },
        { status: 400 }
      )
    }

    // Create the JWT payload
    const payload = {
      username,
      address: address || '0xplaceholderAddress',
      queryKey,
      provider: 'keepkey',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }

    //console.log('Creating JWT with payload:', payload)

    // Create JWT token using AUTH_SECRET
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(AUTH_SECRET))

    // Create response with the session data
    const response = NextResponse.json({ 
      success: true, 
      username, 
      address,
      queryKey 
    })
    
    // Set the auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    //console.log('✅ Auth token set successfully')
    return response
  } catch (error) {
    console.error('❌ KeepKey auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 

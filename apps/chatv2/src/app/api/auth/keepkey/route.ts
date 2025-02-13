import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('KeepKey auth request body:', body)
    
    const { address, username } = body

    if (!address) {
      console.log('❌ Missing address in request')
      return NextResponse.json(
        { error: 'Missing address' },
        { status: 400 }
      )
    }

    // Create session data
    const sessionData = {
      address: address,
      username: username || address, // Use username from context or fallback to address
      provider: 'keepkey',
      isAuthenticated: true,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      iat: Math.floor(Date.now() / 1000)
    }

    console.log('Creating session with data:', sessionData)

    // Create response with the session data
    const response = NextResponse.json(sessionData)
    
    // Set the session cookie using NextAuth's format
    response.cookies.set('next-auth.session-token', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    console.log('✅ Session cookie set successfully')
    return response
  } catch (error) {
    console.error('❌ KeepKey auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 
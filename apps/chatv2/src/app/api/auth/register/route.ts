import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'Registration is temporarily disabled' },
    { status: 503 }
  )
} 
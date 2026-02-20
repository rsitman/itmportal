import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session: session ? 'exists' : 'none',
      user: session?.user || null,
      cookies: process.env.NODE_ENV === 'development' ? {
        hasSessionToken: !!process.env.NEXTAUTH_SECRET
      } : null
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

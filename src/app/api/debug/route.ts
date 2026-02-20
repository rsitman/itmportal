import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Test NextAuth konfigurace
    const config = {
      secret: !!authOptions.secret,
      providers: authOptions.providers?.length || 0,
      pages: authOptions.pages
    }
    
    return NextResponse.json({
      status: 'NextAuth v3 loaded',
      config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'NextAuth error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

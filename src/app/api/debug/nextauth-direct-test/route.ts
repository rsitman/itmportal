import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Přímý import authOptions bez NextAuth middleware
    const { authOptions } = await import('@/lib/auth')
    
    const config = {
      secret: !!authOptions.secret,
      providers: authOptions.providers?.length || 0,
      pages: authOptions.pages
    }
    
    return NextResponse.json({
      status: 'NextAuth v3 loaded directly',
      config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'NextAuth import error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

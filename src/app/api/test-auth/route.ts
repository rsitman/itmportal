import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AUTH ROUTE ===')
    console.log('Auth options exists:', !!authOptions)
    console.log('Providers count:', authOptions.providers?.length || 0)
    console.log('Has credentials provider:', authOptions.providers?.some(p => p.id === 'credentials'))
    console.log('=== TEST AUTH ROUTE END ===')

    return NextResponse.json({
      success: true,
      providersCount: authOptions.providers?.length || 0,
      hasCredentials: authOptions.providers?.some(p => p.id === 'credentials')
    })
  } catch (error) {
    console.error('Test auth route error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

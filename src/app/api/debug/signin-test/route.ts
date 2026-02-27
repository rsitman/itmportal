import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('=== DEBUG SIGNIN TEST ===')
    console.log('Request body:', body)
    console.log('Headers:', Object.fromEntries(request.headers))
    
    return NextResponse.json({
      status: 'debug test received',
      body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

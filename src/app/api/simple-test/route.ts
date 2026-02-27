import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE TEST ROUTE ===')
    console.log('This route should work without NextAuth interference')
    console.log('=== SIMPLE TEST ROUTE END ===')

    return NextResponse.json({
      success: true,
      message: 'Simple test route works',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Simple test route error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

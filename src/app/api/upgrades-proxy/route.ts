// CORS proxy pro upgrady server
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Získání originu pro CORS
    const origin = request.headers.get('origin') || '*'
    
    // Volání upgradovacího serveru
    const response = await fetch('http://itmsql01:44612/web/upgrades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Firma-Portal/1.0'
      },
      signal: AbortSignal.timeout(15000) // 15s timeout
    })
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Vrácení dat s CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'public, max-age=300' // 5 minut cache
      }
    })

  } catch (error) {
    logger.error('CORS Proxy Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch upgrades via proxy',
        details: error instanceof Error ? error.message : 'Unknown error',
        proxyError: true
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

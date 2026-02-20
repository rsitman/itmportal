import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  
  try {
    const erpBaseUrl = process.env.ERP_API_URL || 'http://itmsql01:44612/web'
    // Remove 'web/' from path if it exists to avoid duplication
    const cleanPath = path.startsWith('web/') ? path.replace('web/', '') : path
    const fullUrl = `${erpBaseUrl}/${cleanPath}`
    
    logger.log(`ERP Proxy: Original path=${path}`)
    logger.log(`ERP Proxy: Clean path=${cleanPath}`)
    logger.log(`ERP Proxy: ERP_BASE_URL=${erpBaseUrl}`)
    logger.log(`ERP Proxy: Full URL=${fullUrl}`)
    logger.log(`ERP Proxy: Request URL=${request.url}`)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout for VPN connection issues
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      if (response.status === 404) {
        logger.log(`ERP Proxy: Endpoint not found: ${fullUrl}`)
      } else {
        logger.error(`ERP Proxy: HTTP error ${response.status} for ${fullUrl}`)
      }
      return NextResponse.json(
        { error: `ERP API error: ${response.status} - ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    logger.log(`ERP Proxy: Successfully fetched data from ${fullUrl}`)
    
    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('ERP Proxy: Request timeout - VPN connection issue?')
        return NextResponse.json(
          { error: 'ERP server timeout - check VPN connection' },
          { status: 408 }
        )
      } else if (error.message.includes('ECONNREFUSED')) {
        logger.error('ERP Proxy: Connection refused - VPN not connected?')
        return NextResponse.json(
          { error: 'ERP server unreachable - check VPN connection' },
          { status: 503 }
        )
      }
    }
    
    logger.error('ERP proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612/web'
    
    logger.log(`ERP Health Check: Testing connection to ${erpUrl}`)
    
    const response = await fetch(`${erpUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'connected',
        erpUrl,
        message: 'ERP server is reachable',
        data
      })
    } else {
      return NextResponse.json({
        status: 'error',
        erpUrl,
        message: `ERP server returned ${response.status}: ${response.statusText}`,
        suggestion: 'Check if VPN is connected and ERP server is accessible'
      }, { status: response.status })
    }
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          status: 'timeout',
          message: 'ERP server connection timeout',
          suggestion: 'Check VPN connection and network connectivity'
        }, { status: 408 })
      } else if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          status: 'connection_refused',
          message: 'ERP server connection refused',
          suggestion: 'VPN is not connected or ERP server is not reachable'
        }, { status: 503 })
      }
    }
    
    logger.error('ERP Health Check failed:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to ERP server',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// CORS proxy pro upgrady server
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { fetchUpgradesFromErp } from '@/lib/upgrades-server'

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  const result = await fetchUpgradesFromErp()

  if (result.ok) {
    return NextResponse.json(result.data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300',
      },
    })
  }

  logger.error('CORS Proxy Error:', result.error)

  const errorCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
  return NextResponse.json(
    {
      error: 'Failed to fetch upgrades via proxy',
      details: result.error,
      proxyError: true,
    },
    { status: 500, headers: errorCorsHeaders }
  )
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

function normalizeErpBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/web') ? trimmed.slice(0, -4) : trimmed
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const erpBase = normalizeErpBaseUrl(process.env.ERP_API_URL || 'http://itmsql01:44612')
    const projekt = request.nextUrl.searchParams.get('projekt')
    const url = projekt
      ? `${erpBase}/web/news?projekt=${encodeURIComponent(projekt)}`
      : `${erpBase}/web/news`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      logger.error('ERP news error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `ERP error: ${response.status}`, items: [] },
        { status: response.status }
      )
    }

    const data = await response.json()
    const items = Array.isArray(data) ? data : []
    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      )
    }
    logger.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

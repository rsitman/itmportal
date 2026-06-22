import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { DatabaseTable } from '@/types/database'

function normalizeErpBaseUrl(raw: string) {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/web') ? trimmed.slice(0, -4) : trimmed
}

/** ERP vrací velikosti tabulek v KB; portal pracuje v MB. */
function kbToMb(kb: number): number {
  return Math.round((kb / 1024) * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projekt = searchParams.get('projekt')
    const database = searchParams.get('database')

    if (!projekt || !database) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: projekt, database',
        },
        { status: 400 }
      )
    }

    const erpUrlRaw = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const erpBaseUrl = normalizeErpBaseUrl(erpUrlRaw)
    const fetchUrl = `${erpBaseUrl}/web/databases/tables?projekt=${encodeURIComponent(projekt)}&databaze=${encodeURIComponent(database)}`
    logger.log('Calling database tables API:', fetchUrl)

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch database tables: ${response.status} ${response.statusText}`,
          details: `HTTP_${response.status}`,
          isNetworkError: false,
          fetchUrl,
        },
        { status: response.status }
      )
    }

    const rawData = await response.json()

    let dataArray: unknown[] = []
    if (Array.isArray(rawData)) {
      dataArray = rawData
    } else if (rawData && typeof rawData === 'object' && Array.isArray((rawData as { data?: unknown[] }).data)) {
      dataArray = (rawData as { data: unknown[] }).data
    }

    const tables: DatabaseTable[] = dataArray.map((item) => {
      const row = item as Record<string, unknown>
      return {
        tabulka: String(row.tabulka ?? ''),
        velikost: kbToMb(Number(row.velikost) || 0),
        narust_den: kbToMb(Number(row.narust_den) || 0),
      }
    })

    logger.log(`Database tables: ${tables.length} records for ${projekt}/${database}`)

    return NextResponse.json({
      success: true,
      data: tables,
      metadata: {
        projekt,
        database,
        totalTables: tables.length,
        hasData: tables.length > 0,
      },
    })
  } catch (error) {
    logger.error('Error in database tables API:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError =
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('EAI_AGAIN') ||
      errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.toLowerCase().includes('fetch failed')

    return NextResponse.json(
      {
        success: false,
        error: isNetworkError
          ? 'Network error - cannot connect to database tables server'
          : 'Failed to fetch database tables data',
        details: errorMessage,
        isNetworkError,
      },
      { status: 500 }
    )
  }
}

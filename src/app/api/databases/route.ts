import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { fetchDatabasesFromErp } from '@/lib/databases-server'

export async function GET(request: NextRequest) {
  const result = await fetchDatabasesFromErp()

  if (result.ok) {
    return NextResponse.json({
      success: true,
      data: {
        databases: result.databases,
        totalDatabases: result.databases.length,
        lastUpdated: new Date().toISOString(),
      },
    })
  }

  logger.error('🔍 DEBUG: Error in databases API:', result.error)

  return NextResponse.json(
    {
      success: false,
      error: result.isNetworkError
        ? 'Network error - cannot connect to database server'
        : 'Failed to fetch databases',
      details: result.error,
      isNetworkError: result.isNetworkError,
      serverUrl: 'http://itmsql01:44612/web/databases',
    },
    { status: 500 }
  )
}

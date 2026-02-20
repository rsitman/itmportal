import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    
    // Přidání CORS headers pro lokální vývoj
    const response = await fetch('http://itmsql01:44612/web/databases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
      
    if (!response.ok) {
      throw new Error(`Failed to fetch databases: ${response.status} ${response.statusText}`)
    }
    
    const databases: Database[] = await response.json()
    
    // Seřazení podle názvu firmy
    const sortedDatabases = databases.sort((a, b) => 
      a.firma_nazev.localeCompare(b.firma_nazev, 'cs')
    )

    return NextResponse.json({
      success: true,
      data: {
        databases: sortedDatabases,
        totalDatabases: databases.length,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('🔍 DEBUG: Error in databases API:', error)
    
    // Specifická hláška pro síťové chyby
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('NetworkError') || 
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('timeout')
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNetworkError ? 'Network error - cannot connect to database server' : 'Failed to fetch databases',
        details: errorMessage,
        isNetworkError,
        serverUrl: 'http://itmsql01:44612/web/databases'
      },
      { status: 500 }
    )
  }
}

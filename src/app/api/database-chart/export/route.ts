import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projekt = searchParams.get('projekt')
    const database = searchParams.get('database')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    if (!projekt || !database || !startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: projekt, database, startDate, endDate' 
        },
        { status: 400 }
      )
    }

    // Volání na reálný endpoint pro data
    const response = await fetch(`http://itmsql01:44612/web/databases/history?projekt=${projekt}&databaze=${database}&datum_od=${startDate}&datum_do=${endDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
      
    if (!response.ok) {
      throw new Error(`Failed to fetch database history: ${response.status} ${response.statusText}`)
    }
    
    const historyData = await response.json()
    
    // Generování CSV z reálných dat
    const csvHeader = 'Datum,Max_velikost_DB_MB,Aktualni_velikost_DB_MB,Vyuziti_DB_Proc,Max_velikost_Log_MB,Aktualni_velikost_Log_MB,Vyuziti_Log_Proc\n'
    const csvData = historyData.map((item: any) => {
      const dbUsagePercent = Math.round((item.velikost_db / item.velikost_max) * 100)
      const logUsagePercent = Math.round((item.velikost_log_db / item.velikost_log_max) * 100)
      
      return `${item.datum.split('T')[0]},${item.velikost_max},${item.velikost_db},${dbUsagePercent},${item.velikost_log_max},${item.velikost_log_db},${logUsagePercent}`
    }).join('\n')

    const csvContent = csvHeader + csvData

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${database}_chart_${startDate}_${endDate}.csv"`
      }
    })

  } catch (error) {
    logger.error('Error in database chart export API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('NetworkError') || 
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('timeout')
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNetworkError ? 'Network error - cannot connect to database history server' : 'Failed to export database chart data',
        details: errorMessage,
        isNetworkError,
        serverUrl: 'http://itmsql01:44612/web/databases/history'
      },
      { status: 500 }
    )
  }
}

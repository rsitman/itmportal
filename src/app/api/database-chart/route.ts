import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projekt = searchParams.get('projekt')
    const database = searchParams.get('database')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!projekt || !database || !startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: projekt, database, startDate, endDate' 
        },
        { status: 400 }
      )
    }

    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const fetchUrl = `${erpUrl}/web/databases/history?projekt=${projekt}&databaze=${database}&datum_od=${startDate}&datum_do=${endDate}`
    logger.log('Calling database history API:', fetchUrl)
    
    const response = await fetch(fetchUrl, {
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
    
    // Normalize data array
    let dataArray: any[] = []
    if (Array.isArray(historyData)) {
      dataArray = historyData
    } else if (historyData && typeof historyData === 'object' && Array.isArray(historyData.data)) {
      dataArray = historyData.data
    }
    
    logger.log(`Database history: ${dataArray.length} records for ${projekt}/${database}`)
    
    // Single-pass mapping — transform all 6 chart series in one loop
    const maxDb: { x: string; y: number }[] = []
    const sizeDb: { x: string; y: number }[] = []
    const usedDb: { x: string; y: number }[] = []
    const maxLog: { x: string; y: number }[] = []
    const sizeLog: { x: string; y: number }[] = []
    const usedLog: { x: string; y: number }[] = []
    
    for (const item of dataArray) {
      const date = item.datum?.split('T')[0] || ''
      maxDb.push({ x: date, y: item.velikost_max })
      sizeDb.push({ x: date, y: item.velikost_souboru })
      usedDb.push({ x: date, y: item.velikost_db })
      maxLog.push({ x: date, y: item.velikost_log_max })
      sizeLog.push({ x: date, y: item.velikost_log_souboru })
      usedLog.push({ x: date, y: item.velikost_log_db })
    }
    
    const chartData = [
      { name: 'Max velikost DB', color: '#6b7280', data: maxDb },
      { name: 'Aktuální velikost DB', color: '#3b82f6', data: sizeDb },
      { name: 'Velikost DB v rámci souboru', color: '#8b5cf6', data: usedDb },
      { name: 'Max velikost Log', color: '#6b7280', data: maxLog },
      { name: 'Aktuální velikost Log', color: '#f59e0b', data: sizeLog },
      { name: 'Velikost Log v rámci souboru', color: '#10b981', data: usedLog },
    ]
    
    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        projekt,
        database,
        dateRange: { start: startDate, end: endDate },
        totalPoints: dataArray.length,
        hasData: dataArray.length > 0
      }
    })

  } catch (error) {
    logger.error('Error in database chart API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('NetworkError') || 
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('timeout')
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNetworkError ? 'Network error - cannot connect to database history server' : 'Failed to fetch database chart data',
        details: errorMessage,
        isNetworkError,
      },
      { status: 500 }
    )
  }
}

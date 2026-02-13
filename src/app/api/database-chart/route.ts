import { NextRequest, NextResponse } from 'next/server'

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

    console.log('Calling database history API with URL:', `http://itmsql01:44612/web/databases/history?projekt=${projekt}&databaze=${database}&datum_od=${startDate}&datum_do=${endDate}`)
    
    // Volání na reálný endpoint
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
    console.log('Raw history data from API:', historyData)
    console.log('History data type:', typeof historyData)
    console.log('History data isArray:', Array.isArray(historyData))
    console.log('History data length:', historyData?.length)
    
    // Pokud jsou data prázdná, vypišeme varování
    if (!historyData || (Array.isArray(historyData) && historyData.length === 0)) {
      console.warn('No history data returned from API for:', {
        projekt,
        database,
        dateRange: { start: startDate, end: endDate }
      })
    }
    
    // Transformace dat do formátu pro grafy
    // Test prvního záznamu pro ověření formátu
    if (Array.isArray(historyData) && historyData.length > 0) {
      console.log('First data item sample:', historyData[0])
      console.log('Expected fields:', {
        datum: 'string',
        velikost_souboru: 'number',
        velikost_max: 'number',
        velikost_db: 'number',
        velikost_log_souboru: 'number',
        velikost_log_max: 'number',
        velikost_log_db: 'number'
      })
      
      // Ověření, zda má všechny očekávané vlastnosti
      const firstItem = historyData[0]
      const hasRequiredFields = firstItem && 
        typeof firstItem.datum === 'string' &&
        typeof firstItem.velikost_max === 'number' &&
        typeof firstItem.velikost_db === 'number' &&
        typeof firstItem.velikost_log_max === 'number' &&
        typeof firstItem.velikost_log_db === 'number'
      
      console.log('Has required fields:', hasRequiredFields)
      
      if (!hasRequiredFields) {
        console.warn('Data format mismatch - missing or incorrect field types')
        console.log('Available fields:', Object.keys(firstItem || {}))
      }
    }
    
    // Ověření datových struktur
    if (Array.isArray(historyData) && historyData.length > 0) {
      console.log('=== DATA STRUCTURE ANALYSIS ===')
      historyData.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, {
          datum: item.datum,
          velikost_souboru: item.velikost_souboru,
          velikost_max: item.velikost_max,
          velikost_db: item.velikost_db,
          velikost_log_souboru: item.velikost_log_souboru,
          velikost_log_max: item.velikost_log_max,
          velikost_log_db: item.velikost_log_db
        })
      })
      console.log('=== END ANALYSIS ===')
    }
    
    let dataArray = []
    
    if (Array.isArray(historyData)) {
      dataArray = historyData
    } else if (historyData && typeof historyData === 'object') {
      // Možná data jsou v objektu s polem 'data'
      if (Array.isArray(historyData.data)) {
        dataArray = historyData.data
      } else {
        console.warn('Unexpected data format:', historyData)
        dataArray = []
      }
    } else {
      console.warn('Invalid data format:', historyData)
      dataArray = []
    }
    
    console.log('Final data array for processing:', dataArray)
    console.log('Data array length:', dataArray.length)
    
    const chartData = [
      // Databázový soubor - 3 řady
      {
        name: 'Max velikost DB',
        color: '#6b7280',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_max
        }))
      },
      {
        name: 'Aktuální velikost DB',
        color: '#3b82f6',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_souboru
        }))
      },
      {
        name: 'Velikost DB v rámci souboru',
        color: '#8b5cf6',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_db
        }))
      },
      // Log soubor - 3 řady
      {
        name: 'Max velikost Log',
        color: '#6b7280',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_log_max
        }))
      },
      {
        name: 'Aktuální velikost Log',
        color: '#f59e0b',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_log_souboru
        }))
      },
      {
        name: 'Velikost Log v rámci souboru',
        color: '#10b981',
        data: dataArray.map((item: any) => ({
          x: item.datum.split('T')[0],
          y: item.velikost_log_db
        }))
      }
    ]
    
    console.log('Transformed chart data:', chartData)
    
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
    console.error('🔍 DEBUG: Error in database chart API:', error)
    
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
        serverUrl: 'http://itmsql01:44612/web/databases/history'
      },
      { status: 500 }
    )
  }
}

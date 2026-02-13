import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock data for database size by company and day
// In real implementation, this would come from your database or external API
const generateMockDbSizeData = () => {
  const companies = ['ABS_JETS', 'CESKA_POSTA', 'COOP', 'PENNY', 'LIDL']
  const startDate = new Date('2026-01-01')
  const endDate = new Date('2026-01-31')
  
  const data: any[] = []
  
  companies.forEach(company => {
    const baseSize = Math.random() * 50000 + 10000 // Base size between 10GB-60GB
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // Simulate daily growth with some randomness
      const dailyGrowth = Math.random() * 500 + 100 // 100MB-600MB daily growth
      const randomVariation = (Math.random() - 0.5) * 1000 // ±500MB variation
      
      const size = baseSize + (dailyGrowth * Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + randomVariation
      
      data.push({
        company,
        date: new Date(currentDate),
        size: Math.max(0, size) // Ensure non-negative
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  })
  
  return data
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Generate mock data
    let data = generateMockDbSizeData()
    
    // Filter by company if specified
    if (company) {
      data = data.filter(item => item.company === company)
    }
    
    // Filter by date range if specified
    if (startDate) {
      const start = new Date(startDate)
      data = data.filter(item => item.date >= start)
    }
    
    if (endDate) {
      const end = new Date(endDate)
      data = data.filter(item => item.date <= end)
    }

    // Transform data for chart consumption
    const companies = [...new Set(data.map(item => item.company))]
    
    const chartData = companies.map(comp => {
      const companyData = data
        .filter(item => item.company === comp)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
      
      return {
        name: comp,
        data: companyData.map(item => ({
          x: item.date,
          y: Math.round(item.size), // Size in MB
          label: `${comp}: ${Math.round(item.size)}MB`
        }))
      }
    })

    return NextResponse.json({
      data: chartData,
      metadata: {
        companies,
        totalRecords: data.length,
        dateRange: {
          start: data.length > 0 ? data[0].date : null,
          end: data.length > 0 ? data[data.length - 1].date : null
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching DB size data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DB size data' },
      { status: 500 }
    )
  }
}

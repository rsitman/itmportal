import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'

// Mock data for database size by company and day
// In real implementation, this would come from your database or external API
const generateMockDbSizeData = (requestedCompany?: string) => {
  // Default companies for overview, or use requested company
  const companies = requestedCompany 
    ? [requestedCompany]
    : ['ABS_JETS', 'CESKA_POSTA', 'COOP', 'PENNY', 'LIDL', 'NÁKUPNÍ', 'PRODEJNÍ', 'SKLADOVÁ', 'FINANČNÍ', 'LOGISTICKÁ']
  
  const startDate = new Date('2026-01-01')
  const endDate = new Date('2026-01-31')
  
  const data: any[] = []
  
  companies.forEach(company => {
    const baseMdfSize = Math.random() * 40000 + 8000 // Base MDF size between 8GB-48GB
    const baseLdfSize = Math.random() * 8000 + 2000 // Base LDF size between 2GB-10GB
    const maxMdfSize = baseMdfSize * 1.5 // Max MDF size is 50% larger
    const maxLdfSize = baseLdfSize * 1.5 // Max LDF size is 50% larger
    
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // Simulate daily growth with some randomness
      const dailyMdfGrowth = Math.random() * 200 + 50 // 50MB-250MB daily MDF growth
      const dailyLdfGrowth = Math.random() * 50 + 10 // 10MB-60MB daily LDF growth
      const randomMdfVariation = (Math.random() - 0.5) * 500 // ±250MB MDF variation
      const randomLdfVariation = (Math.random() - 0.5) * 100 // ±50MB LDF variation
      
      const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const mdfFileSize = Math.min(maxMdfSize, baseMdfSize + (dailyMdfGrowth * daysPassed) + randomMdfVariation)
      const ldfFileSize = Math.min(maxLdfSize, baseLdfSize + (dailyLdfGrowth * daysPassed) + randomLdfVariation)
      
      // Database usage is typically less than file size (unused space)
      const databaseUsage = mdfFileSize * 0.85 // 85% of MDF file is actually used
      const logUsage = ldfFileSize * 0.75 // 75% of LDF file is actually used
      
      data.push({
        company,
        date: new Date(currentDate),
        mdfFileSize: Math.max(0, mdfFileSize), // MDF file size (velikost)
        mdfFreeSpace: Math.max(0, mdfFileSize - databaseUsage), // Free space in MDF (velikost_volne)
        ldfFileSize: Math.max(0, ldfFileSize), // LDF file size (velikost_log)
        ldfFreeSpace: Math.max(0, ldfFileSize - logUsage), // Free space in LDF (velikost_log_volne)
        maxDbSize: maxMdfSize, // Maximum database size (velikost_max)
        maxLdfSize: maxLdfSize, // Maximum LDF size (velikost_log_max)
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

    logger.info(`📊 Chart API request - Company: ${company}, Start: ${startDate}, End: ${endDate}`)

    // Generate mock data for the requested company or all companies
    let data = generateMockDbSizeData(company || undefined)
    
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
    
    const allMdfSeries: any[] = []
    const allLdfSeries: any[] = []
    
    companies.forEach(comp => {
      const companyData = data
        .filter(item => item.company === comp)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Create separate series for MDF and LDF charts
      const mdfSeries = [
        {
          name: 'Využitá velikost DB',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.mdfFileSize - item.mdfFreeSpace), // Actual database usage
            label: `${comp} DB využití: ${Math.round(item.mdfFileSize - item.mdfFreeSpace)}MB`
          }))
        },
        {
          name: 'Velikost MDF souboru',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.mdfFileSize), // MDF file size
            label: `${comp} MDF: ${Math.round(item.mdfFileSize)}MB`
          }))
        },
        {
          name: 'Volné místo v MDF',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.mdfFreeSpace), // Free space in MDF
            label: `${comp} volné MDF: ${Math.round(item.mdfFreeSpace)}MB`
          }))
        },
        {
          name: 'Max velikost DB',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.maxDbSize), // Maximum database size
            label: `${comp} Max DB: ${Math.round(item.maxDbSize)}MB`
          }))
        }
      ]
      
      const ldfSeries = [
        {
          name: 'Využitá velikost LDF',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.ldfFileSize - item.ldfFreeSpace), // Actual log usage
            label: `${comp} LDF využití: ${Math.round(item.ldfFileSize - item.ldfFreeSpace)}MB`
          }))
        },
        {
          name: 'Velikost LDF souboru',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.ldfFileSize), // LDF file size
            label: `${comp} LDF: ${Math.round(item.ldfFileSize)}MB`
          }))
        },
        {
          name: 'Max velikost LDF',
          data: companyData.map(item => ({
            x: item.date,
            y: Math.round(item.maxLdfSize), // Maximum LDF size
            label: `${comp} Max LDF: ${Math.round(item.maxLdfSize)}MB`
          }))
        }
      ]
      
      allMdfSeries.push(...mdfSeries)
      allLdfSeries.push(...ldfSeries)
    })

    return NextResponse.json({
      mdfData: allMdfSeries,
      ldfData: allLdfSeries,
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
    logger.error('Error fetching DB size data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DB size data' },
      { status: 500 }
    )
  }
}

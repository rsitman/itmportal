import { KaratProject, mapKaratProjects } from './karat'
import { logger } from './logger'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Use KARAT API URL from environment
const ERP_BASE_URL = process.env.KARAT_API_URL || process.env.ERP_API_URL || 'http://itmsql01:44612/web'

// Test DNS resolution at startup
if (process.env.NODE_ENV === 'development') {
  logger.log('🔍 ERP_BASE_URL:', ERP_BASE_URL)
  logger.log('🔍 Testing DNS resolution for itmsql01...')
  
  // Try to resolve the hostname
  try {
    const { execSync } = require('child_process')
    const result = execSync('nslookup itmsql01 2>&1 || host itmsql01 2>&1 || echo "DNS lookup failed"', { 
      encoding: 'utf8',
      timeout: 5000 
    })
    logger.log('🔍 DNS resolution result:', result.trim())
  } catch (error) {
    logger.log('🔍 DNS resolution error:', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Přímé volání KARAT ERP - bez roundtripu přes vlastní API routes.
 * Použití v server components a API routes místo fetch na localhost.
 */
export async function fetchKaratProjectsDirect(): Promise<KaratProject[]> {
  try {
    // Get server session and token
    const session = await getServerSession(authOptions)
    const token = session?.accessToken

    const url = `${ERP_BASE_URL}/patchovani_data`
    logger.log('🔍 Fetching KARAT data from:', url)
    logger.log('🔍 Session available:', !!session)
    logger.log('🔍 Token available:', !!token)
    
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      'Accept': 'application/json',
    }

    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, {
      cache: 'no-store', // cache 5 minut
      headers
    })

    logger.log('🔍 KARAT response status:', response.status, response.statusText)
    logger.log('🔍 KARAT response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      // Don't log 404 as error - it might be expected behavior
      if (response.status === 404) {
        logger.log('KARAT endpoint not available (404) - returning empty data')
        logger.log('🔍 Full URL that returned 404:', url)
        logger.log('🔍 ERP_BASE_URL from env:', ERP_BASE_URL)
      } else {
        logger.error('KARAT direct fetch error:', response.status, response.statusText)
      }
      return []
    }

    const rawData = await response.json()
    console.log('RAW DATA length:', Array.isArray(rawData) ? rawData.length : 'not array', typeof rawData)
    const projects = mapKaratProjects(rawData)
    logger.log(`✅ ${projects.length} KARAT projects fetched directly`)
    return projects
  } catch (error) {
    logger.error('KARAT direct fetch failed:', error)
    return []
  }
}

export async function fetchServiceProjectsDirect(): Promise<any[]> {
  try {
    const url = `${ERP_BASE_URL}/projects`
    const response = await fetch(url, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      logger.error('KARAT service projects fetch error:', response.status)
      return []
    }

    const rawData = await response.json()
    logger.log(`✅ ${rawData.length} service projects fetched directly`)

    return rawData.map((project: any) => ({
      doklad_proj: project.projekt || '',
      nazev: project.nazev || '',
      jira_klic: project.jira_klic || '',
      nazev_par: project.nazev_par || '',
      gps: project.gps || '',
      logo: project.logo || '',
    }))
  } catch (error) {
    logger.error('KARAT service projects fetch failed:', error)
    return []
  }
}

export async function fetchDatabaseHistoryDirect(
  projekt: string,
  database: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  try {
    const url = `${ERP_BASE_URL}/databases/history?projekt=${projekt}&databaze=${database}&datum_od=${startDate}&datum_do=${endDate}`
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // cache 1 hodina - historická data se nemění často
    })

    if (!response.ok) {
      logger.error('Database history fetch error:', response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data?.data || []
  } catch (error) {
    logger.error('Database history fetch failed:', error)
    return []
  }
}

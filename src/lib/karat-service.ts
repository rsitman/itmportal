import { KaratProject, mapKaratProjects } from './karat'
import { logger } from './logger'

const ERP_BASE_URL = process.env.ERP_API_URL || 'http://itmsql01:44612'

/**
 * Přímé volání KARAT ERP - bez roundtripu přes vlastní API routes.
 * Použití v server components a API routes místo fetch na localhost.
 */
export async function fetchKaratProjectsDirect(): Promise<KaratProject[]> {
  try {
    const response = await fetch(`${ERP_BASE_URL}/web/patchovani_data`, {
      next: { revalidate: 300 }, // cache 5 minut
    })

    if (!response.ok) {
      logger.error('KARAT direct fetch error:', response.status, response.statusText)
      return []
    }

    const rawData = await response.json()
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
    const response = await fetch(`${ERP_BASE_URL}/web/projects`, {
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
    const url = `${ERP_BASE_URL}/web/databases/history?projekt=${projekt}&databaze=${database}&datum_od=${startDate}&datum_do=${endDate}`
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

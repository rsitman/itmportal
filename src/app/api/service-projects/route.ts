import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ServiceProject } from '@/types/project'
import { logger } from '@/lib/logger'

async function getServiceProjects(): Promise<ServiceProject[]> {
  try {
    // Volání na reálný IS KARAT endpoint /web/projects
    const fetchUrl = 'http://itmsql01:44612/web/projects'
    
    const response = await fetch(fetchUrl)
    
    if (!response.ok) {
      logger.error('Failed to fetch from /web/projects:', response.status)
      throw new Error(`Failed to fetch service projects: ${response.status}`)
    }

    const rawData = await response.json()
    logger.log(`✅ ${rawData.length} service projects from KARAT`)
    
    // Transformace dat na strukturu ServiceProject
    return rawData.map((project: any) => ({
      doklad_proj: project.projekt || '',
      nazev: project.nazev || '',
      jira_klic: project.jira_klic || '',
      nazev_par: project.nazev_par || '',
      gps: project.gps || '',
      logo: project.logo || '' // Přidáno pro loga z ERP
    }))
  } catch (error) {
    logger.error('Error fetching service projects:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch service projects from IS KARAT
    const projects = await getServiceProjects()
    
    return NextResponse.json(projects)
    
  } catch (error) {
    logger.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

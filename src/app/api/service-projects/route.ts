import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ServiceProject } from '@/types/project'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'

async function getServiceProjects(): Promise<ServiceProject[]> {
  try {
    // Get server session and token
    const session = await getServerSession(authOptions)
    const token = session?.accessToken

    // Use KARAT_API_URL from environment
    const fetchUrl = process.env.KARAT_API_URL 
      ? `${process.env.KARAT_API_URL}/projects`
      : 'http://itmsql01:44612/web/projects'
    
    logger.log('🔍 Fetching service projects from:', fetchUrl)
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
    
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers
    })
    
    logger.log('🔍 Service projects response status:', response.status, response.statusText)

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
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.log('🔍 Service projects API - Session authenticated:', !!session)

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

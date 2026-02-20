import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Zde bude volání na reálný IS KARAT endpoint /web/projects
    const fetchUrl = 'http://itmsql01:44612/web/projects'
    const response = await fetch(fetchUrl)
    
    if (!response.ok) {
      logger.error('Failed to fetch from /web/projects:', response.status)
      return NextResponse.json({ error: 'KARAT unavailable' }, { status: 500 })
    }

    const rawData = await response.json()
    logger.log(`✅ ${rawData.length} service projects from KARAT`)
    
    // Transformace dat na strukturu ServiceProject
    const serviceProjects = rawData.map((project: any) => ({
      projekt: project.projekt || '',
      nazev: project.nazev || '',
      jira_klic: project.jira_klic || '',
      nazev_par: project.nazev_par || '',
      gps: project.gps || ''
    }))
    
    return NextResponse.json(serviceProjects)

  } catch (error) {
    logger.error('KARAT service projects error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

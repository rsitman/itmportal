import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ProjectPerson } from '@/types/project'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectCode = resolvedParams.id

    logger.log(`🔍 Fetching team for projectCode: ${projectCode}`)
    
    const teamResponse = await fetch(`http://itmsql01:44612/web/projects/${projectCode}/pers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    logger.log(`🔍 Team response status: ${teamResponse.status}`)

    if (!teamResponse.ok) {
      logger.error('ERP project team error:', teamResponse.statusText)
      // Fallback data pro testování
      const fallbackData: ProjectPerson[] = [
        {
          kod_role: 'ZAK_INV',
          nazev_role: 'Objednatel - sponzor projektu',
          typ_osoby: 20,
          jmeno: 'Robert',
          prijmeni: 'Novotný',
          telefon: '+420 720 987 086',
          email: 'robert.novotny@signumcz.com'
        }
      ]
      return NextResponse.json({
        projectCode,
        team: fallbackData,
        total: fallbackData.length
      })
    }

    const teamData = await teamResponse.json()
    logger.log(`🔍 Team data received:`, teamData.length || 0, 'members')
    
    const responseData = {
      projectCode,
      team: Array.isArray(teamData) ? teamData : [],
      total: Array.isArray(teamData) ? teamData.length : 0
    }
    
    logger.log(`🔍 Response data:`, responseData.total, 'team members')
    return NextResponse.json(responseData)

  } catch (error) {
    logger.error('Error fetching project team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

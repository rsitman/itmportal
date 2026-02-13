import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ProjectPerson } from '@/types/project'

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

    console.log(`🔍 DEBUG: Fetching team for projectCode: ${projectCode}`)
    
    const teamResponse = await fetch(`http://itmsql01:44612/web/projects/${projectCode}/pers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log(`🔍 DEBUG: Team response status: ${teamResponse.status}`)

    if (!teamResponse.ok) {
      console.error('ERP project team error:', teamResponse.statusText)
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
    console.log(`🔍 DEBUG: Team data received:`, teamData)
    console.log(`🔍 DEBUG: Team data length:`, Array.isArray(teamData) ? teamData.length : 'Not an array')
    
    const responseData = {
      projectCode,
      team: Array.isArray(teamData) ? teamData : [],
      total: Array.isArray(teamData) ? teamData.length : 0
    }
    
    console.log(`🔍 DEBUG: Response data:`, responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching project team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

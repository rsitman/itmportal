import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectPerson } from '@/types/project'

// Helper function to check if user is authenticated
async function isAuthenticated() {
  const session = await getServerSession(authOptions)
  return !!session?.user
}

// GET /api/projects/projectCode/team - Get project team from ERP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectCode: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectCode } = await params

    // Zde bude volání ERP endpointu pro tým projektu
    // Příklad: http://itmsql01:44612/web/projects/{doklad_projektu}/pers
    const erpResponse = await fetch(`http://itmsql01:44612/web/projects/${doklad_projektu}/pers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!erpResponse.ok) {
      console.error('ERP project team error:', erpResponse.statusText)
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
        },
        {
          kod_role: 'ITMAN',
          nazev_role: 'IT Manažer',
          typ_osoby: 0,
          jmeno: 'Petr',
          prijmeni: 'Svoboda',
          telefon: '+420 603 123 456',
          email: 'petr.svoboda@firma.cz'
        },
        {
          kod_role: 'DEV',
          nazev_role: 'Vývojář',
          typ_osoby: 10,
          jmeno: 'Jan',
          prijmeni: 'Novák',
          telefon: '+420 777 888 999',
          email: 'jan.novak@external.cz'
        }
      ]
      return NextResponse.json({
        projectCode: doklad_projektu,
        team: fallbackData,
        total: fallbackData.length
      })
    }

    const erpData = await erpResponse.json()
    return NextResponse.json({
      projectCode: doklad_projektu,
      team: erpData,
      total: Array.isArray(erpData) ? erpData.length : 0
    })

  } catch (error) {
    console.error('Error fetching project team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

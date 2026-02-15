import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ExternalComponent } from '@/types/project'
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

    logger.log(`🔍 DEBUG: Fetching external components for projectCode: ${projectCode}`)
    
    const extcompsResponse = await fetch(`http://itmsql01:44612/web/projects/${projectCode}/extcomps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    logger.log(`🔍 DEBUG: External components response status: ${extcompsResponse.status}`)

    if (!extcompsResponse.ok) {
      logger.error('ERP external components error:', extcompsResponse.statusText)
      // Fallback data pro testování
      const fallbackData: ExternalComponent[] = [
        {
          kod: 'E_SHOP',
          nazev: 'E-shop - B2B pro koncové uživatele',
          popis: 'Custom e-shop dle požadavků SAGITTY.\n\nDodavatel firma WHYS\n\nhttps://b2b.sagitta.cz/',
          forma_kom: 'A-ESH + SYMMY',
          dodavatel: 'Whys s.r.o.',
          jmeno: 'Jan',
          prijmeni: 'Koprajda',
          telefon: '+420 607 117 711',
          email: 'jan@whys.dev'
        }
      ]
      return NextResponse.json({
        projectCode,
        components: fallbackData,
        total: fallbackData.length
      })
    }

    const extcompsData = await extcompsResponse.json()
    logger.log(`🔍 DEBUG: External components data received:`, extcompsData)
    logger.log(`🔍 DEBUG: External components data length:`, Array.isArray(extcompsData) ? extcompsData.length : 'Not an array')
    
    const responseData = {
      projectCode,
      components: Array.isArray(extcompsData) ? extcompsData : [],
      total: Array.isArray(extcompsData) ? extcompsData.length : 0
    }
    
    logger.log(`🔍 DEBUG: Response data:`, responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    logger.error('Error fetching external components:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectLink } from '@/types/project'
import { logger } from '@/lib/logger'

// Stejný base URL jako /extcomps a /team – hardcoded, aby integrace fungovala konzistentně
const ERP_BASE = 'http://itmsql01:44612'

function normalizeLinks(raw: unknown): ProjectLink[] {
  if (Array.isArray(raw)) {
    return raw.map((item: any) => ({
      id_firmy: item?.id_firmy ?? undefined,
      nazev_firmy: item?.nazev_firmy ?? undefined,
      url: typeof item?.url === 'string' ? item.url : '',
      nazev: typeof item?.nazev === 'string' ? item.nazev : '',
      popis: typeof item?.popis === 'string' ? item.popis : undefined,
    }))
  }
  if (raw && typeof raw === 'object' && 'links' in (raw as object) && Array.isArray((raw as { links: unknown }).links)) {
    return normalizeLinks((raw as { links: unknown }).links)
  }
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectCode = resolvedParams.id

    const fetchUrl = `${ERP_BASE}/web/projects/${projectCode}/links`
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      logger.error('ERP project links error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Odkazy projektu nelze načíst z ERP' },
        { status: 502 }
      )
    }

    const raw = await response.json()
    const links = normalizeLinks(raw)

    return NextResponse.json({
      links,
      total: links.length,
    })
  } catch (error) {
    logger.error('Error fetching project links:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

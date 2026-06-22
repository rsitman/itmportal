import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { RegularRequest } from '@/types/project'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'

type RawRegularRequest = Partial<Record<keyof RegularRequest, unknown>>

function getKaratBaseUrl() {
  return (process.env.KARAT_API_URL || 'http://itmsql01:44612/web').replace(/\/$/, '')
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function mapRegularRequests(rawData: unknown): RegularRequest[] {
  if (!Array.isArray(rawData)) {
    return []
  }

  return rawData.map((item) => {
    const request = item as RawRegularRequest
    const requestType = toStringValue(request.typ_poz)

    return {
      projekt: toStringValue(request.projekt),
      projekt_nazev: toStringValue(request.projekt_nazev),
      typ_poz: requestType === 'UNIVYKAZ' ? 'UNIVYKAZ' : 'SERVIS',
      jira_klic: toStringValue(request.jira_klic),
      nazev: toStringValue(request.nazev),
    }
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectCode = resolvedParams.id
    const token = session.accessToken
    const fetchUrl = `${getKaratBaseUrl()}/projects/${projectCode}/jpp`
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      'Accept': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    logger.log(`Fetching regular requests for project ${projectCode} from:`, fetchUrl)

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers,
    })

    if (!response.ok) {
      logger.error('Failed to fetch from /web/projects/{projekt}/jpp:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch project regular requests' },
        { status: response.status }
      )
    }

    const rawData = await response.json()
    const requests = mapRegularRequests(rawData)

    return NextResponse.json({
      projectCode,
      requests,
      total: requests.length,
    })
  } catch (error) {
    logger.error('Error fetching project regular requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project regular requests' },
      { status: 500 }
    )
  }
}

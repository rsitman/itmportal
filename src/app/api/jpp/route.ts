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

function getKaratFetchErrorResponse(error: unknown) {
  const cause =
    error instanceof Error && 'cause' in error
      ? (error.cause as { code?: string; hostname?: string } | undefined)
      : undefined
  const networkCodes = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'])

  if (cause?.code && networkCodes.has(cause.code)) {
    const host = cause.hostname || 'itmsql01'
    return NextResponse.json(
      {
        error: 'karat_unreachable',
        message: `IS KARAT (${host}) není dostupný. Zkontrolujte připojení k VPN nebo firemní síti.`,
      },
      { status: 503 }
    )
  }

  return NextResponse.json(
    { error: 'Failed to fetch regular requests' },
    { status: 500 }
  )
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken
    const fetchUrl = `${getKaratBaseUrl()}/jpp`
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      'Accept': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    logger.log('Fetching regular requests from:', fetchUrl)

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers,
    })

    if (!response.ok) {
      logger.error('Failed to fetch from /web/jpp:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch regular requests' },
        { status: response.status }
      )
    }

    const rawData = await response.json()
    const requests = mapRegularRequests(rawData)

    return NextResponse.json({
      requests,
      total: requests.length,
    })
  } catch (error) {
    logger.error('Error fetching regular requests:', error)
    return getKaratFetchErrorResponse(error)
  }
}

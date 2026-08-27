import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  getSkoleniApiUrl,
  getSkoleniFetchErrorResponseBody,
  mapSkoleni,
} from '@/lib/skoleni-mapper'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken
    const fetchUrl = getSkoleniApiUrl()
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    logger.log('Fetching skoleni from:', fetchUrl)

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers,
    })

    if (!response.ok) {
      logger.error('Failed to fetch from skoleni API:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch skoleni' },
        { status: response.status }
      )
    }

    const rawData = await response.json()
    const skoleni = mapSkoleni(rawData)

    return NextResponse.json({
      skoleni,
      total: skoleni.length,
    })
  } catch (error) {
    logger.error('Error fetching skoleni:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

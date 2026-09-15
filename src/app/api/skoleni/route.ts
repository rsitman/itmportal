import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  fetchSkoleniJson,
  filterPortalSkoleniList,
  getSkoleniFetchErrorResponseBody,
  mapSkoleni,
  skoleniListApiUrl,
} from '@/lib/skoleni-mapper'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fetchUrl = skoleniListApiUrl()
    logger.log('Fetching skoleni from:', fetchUrl)

    const response = await fetchSkoleniJson(fetchUrl, session.accessToken)

    if (!response.ok) {
      logger.error('Failed to fetch from skoleni API:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch skoleni' },
        { status: response.status }
      )
    }

    const skoleni = filterPortalSkoleniList(mapSkoleni(response.data))

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

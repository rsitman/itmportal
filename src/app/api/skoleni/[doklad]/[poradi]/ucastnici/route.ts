import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  fetchSkoleniJson,
  getSkoleniFetchErrorResponseBody,
  mapSkoleniUcastnici,
  parseSkoleniRouteKey,
  skoleniParticipantsApiUrl,
} from '@/lib/skoleni-mapper'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ doklad: string; poradi: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const key = parseSkoleniRouteKey(resolvedParams.doklad, resolvedParams.poradi)
    const token = session.accessToken

    if (!key) {
      return NextResponse.json({ error: 'Invalid školení key' }, { status: 400 })
    }

    const fetchUrl = skoleniParticipantsApiUrl(key.doklad, key.poradiSkol)
    logger.log('Fetching skoleni ucastnici from:', fetchUrl)

    const response = await fetchSkoleniJson(fetchUrl, token)

    if (!response.ok) {
      logger.error('Failed to fetch skoleni ucastnici:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch skoleni ucastnici' },
        { status: response.status }
      )
    }

    const ucastnici = mapSkoleniUcastnici(response.data).filter((item) => {
      const matchesDoklad = !item.doklad || item.doklad === key.doklad
      const matchesPoradi = !item.poradi_skol || item.poradi_skol === key.poradiSkol
      return matchesDoklad && matchesPoradi
    })

    return NextResponse.json({
      doklad: key.doklad,
      poradi_skol: key.poradiSkol,
      ucastnici,
      total: ucastnici.length,
    })
  } catch (error) {
    logger.error('Error fetching skoleni ucastnici:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  buildSkoleniApiUrl,
  getSkoleniFetchErrorResponseBody,
  mapSkoleniUcastnici,
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
    const doklad = decodeURIComponent(resolvedParams.doklad).trim()
    const poradiSkol = Number(resolvedParams.poradi)
    const token = session.accessToken

    if (!doklad || !Number.isFinite(poradiSkol)) {
      return NextResponse.json({ error: 'Invalid školení key' }, { status: 400 })
    }

    const fetchUrl = buildSkoleniApiUrl('/ucastnici', {
      doklad,
      poradi_skol: poradiSkol,
    })
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    logger.log('Fetching skoleni ucastnici from:', fetchUrl)

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers,
    })

    if (!response.ok) {
      logger.error('Failed to fetch skoleni ucastnici:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch skoleni ucastnici' },
        { status: response.status }
      )
    }

    const rawData = await response.json()
    const ucastnici = mapSkoleniUcastnici(rawData).filter((item) => {
      const matchesDoklad = !item.doklad || item.doklad === doklad
      const matchesPoradi = !item.poradi_skol || item.poradi_skol === poradiSkol
      return matchesDoklad && matchesPoradi
    })

    return NextResponse.json({
      doklad,
      poradi_skol: poradiSkol,
      ucastnici,
      total: ucastnici.length,
    })
  } catch (error) {
    logger.error('Error fetching skoleni ucastnici:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

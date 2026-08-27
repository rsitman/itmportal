import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  buildSkoleniApiUrl,
  findSkoleniByKey,
  getSkoleniFetchErrorResponseBody,
  mapSkoleni,
  mapSkoleniDetail,
  skoleniFromListItem,
} from '@/lib/skoleni-mapper'

async function fetchJson(url: string, token?: string) {
  const headers: Record<string, string> = {
    'User-Agent': 'NextJS-Server',
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    cache: 'no-store',
    headers,
  })

  if (!response.ok) {
    return { ok: false as const, status: response.status, data: null }
  }

  return { ok: true as const, status: response.status, data: await response.json() }
}

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
      return NextResponse.json({ error: 'Invalid skolení key' }, { status: 400 })
    }

    const detailUrl = buildSkoleniApiUrl('/detail', {
      doklad,
      poradi_skol: poradiSkol,
    })

    logger.log('Fetching skoleni detail from:', detailUrl)

    const detailResponse = await fetchJson(detailUrl, token)

    if (!detailResponse.ok) {
      logger.error('Failed to fetch skoleni detail:', detailResponse.status)
      return NextResponse.json(
        { error: 'Failed to fetch skoleni detail' },
        { status: detailResponse.status }
      )
    }

    let detail = mapSkoleniDetail(detailResponse.data)
    let source: 'detail' | 'list' = 'detail'

    if (!detail) {
      const listUrl = buildSkoleniApiUrl('')
      logger.log('Skoleni detail empty, falling back to list:', listUrl)
      const listResponse = await fetchJson(listUrl, token)

      if (listResponse.ok) {
        const match = findSkoleniByKey(mapSkoleni(listResponse.data), doklad, poradiSkol)
        if (match) {
          detail = skoleniFromListItem(match)
          source = 'list'
        }
      }
    }

    if (!detail) {
      return NextResponse.json({ error: 'Školení nebylo nalezeno' }, { status: 404 })
    }

    return NextResponse.json({
      doklad,
      poradi_skol: poradiSkol,
      detail,
      source,
    })
  } catch (error) {
    logger.error('Error fetching skoleni detail:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

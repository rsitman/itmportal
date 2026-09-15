import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  getSkoleniFetchErrorResponseBody,
  loadSkoleniDetail,
  parseSkoleniRouteKey,
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

    if (!key) {
      return NextResponse.json({ error: 'Invalid skolení key' }, { status: 400 })
    }

    logger.log('Fetching skoleni detail:', key.doklad, key.poradiSkol)

    const detail = await loadSkoleniDetail(key.doklad, key.poradiSkol, session.accessToken)

    if (!detail) {
      return NextResponse.json({ error: 'Školení nebylo nalezeno' }, { status: 404 })
    }

    return NextResponse.json({
      doklad: key.doklad,
      poradi_skol: key.poradiSkol,
      detail,
    })
  } catch (error) {
    logger.error('Error fetching skoleni detail:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

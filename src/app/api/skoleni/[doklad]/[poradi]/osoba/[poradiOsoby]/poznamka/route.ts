import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  getSkoleniFetchErrorResponseBody,
  mutateSkoleniPoznamka,
  parseSkoleniRouteKey,
} from '@/lib/skoleni-mapper'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ doklad: string; poradi: string; poradiOsoby: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const key = parseSkoleniRouteKey(resolvedParams.doklad, resolvedParams.poradi)
    const poradiOsoby = Number(decodeURIComponent(resolvedParams.poradiOsoby))
    if (!key || !Number.isFinite(poradiOsoby)) {
      return NextResponse.json({ error: 'Invalid osoba key' }, { status: 400 })
    }

    let body: { poznamka?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const poznamka = typeof body.poznamka === 'string' ? body.poznamka : ''
    if (poznamka.length > 255) {
      return NextResponse.json({ error: 'Poznámka může mít nejvýše 255 znaků.' }, { status: 400 })
    }

    const result = await mutateSkoleniPoznamka(
      key.doklad,
      key.poradiSkol,
      poradiOsoby,
      poznamka,
      session.accessToken
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, poznamka, person: result.person })
  } catch (error) {
    logger.error('Error updating skoleni poznamka:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

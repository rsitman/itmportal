import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  getSkoleniFetchErrorResponseBody,
  mutateSkoleniZapis,
  parseSkoleniRouteKey,
} from '@/lib/skoleni-mapper'

export async function POST(
  request: Request,
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
      return NextResponse.json({ error: 'Invalid školení key' }, { status: 400 })
    }

    let body: { poznamka?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    if (typeof body.poznamka !== 'string') {
      return NextResponse.json(
        { error: 'Poznámka musí být text.', message: 'Poznámka musí být text.' },
        { status: 400 }
      )
    }

    const poznamka = body.poznamka.replace(/\r\n/g, '\n')
    const result = await mutateSkoleniZapis(key.doklad, key.poradiSkol, poznamka, session.accessToken)

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, poznamka, detail: result.detail })
  } catch (error) {
    logger.error('Error updating skoleni zapis:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

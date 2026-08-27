import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  callSkoleniMutation,
  getSkoleniFetchErrorResponseBody,
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

    let body: { stav?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const stav = Number(body.stav)
    if (stav !== 20 && stav !== 30) {
      return NextResponse.json({ error: 'Stav musí být 20 nebo 30.' }, { status: 400 })
    }

    const result = await callSkoleniMutation(
      `/stav/${encodeURIComponent(key.doklad)}/${encodeURIComponent(String(key.poradiSkol))}`,
      { stav },
      session.accessToken
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, stav, result: result.data })
  } catch (error) {
    logger.error('Error updating skoleni stav:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

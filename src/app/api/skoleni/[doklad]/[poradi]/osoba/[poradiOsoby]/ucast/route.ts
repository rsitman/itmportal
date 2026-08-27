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

    let body: { ucast?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const ucast = Number(body.ucast)
    if (ucast !== 0 && ucast !== 1) {
      return NextResponse.json({ error: 'Účast musí být 0 nebo 1.' }, { status: 400 })
    }

    const result = await callSkoleniMutation(
      `/osoba/ucast/${encodeURIComponent(key.doklad)}/${encodeURIComponent(String(key.poradiSkol))}/${encodeURIComponent(String(poradiOsoby))}`,
      { ucast },
      session.accessToken
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, ucast, result: result.data })
  } catch (error) {
    logger.error('Error updating skoleni ucast:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

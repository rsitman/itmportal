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

    let body: { e_mail?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const e_mail = typeof body.e_mail === 'string' ? body.e_mail.trim() : ''

    const result = await callSkoleniMutation(
      `/osoba/dtz_odeslat/${encodeURIComponent(key.doklad)}/${encodeURIComponent(String(key.poradiSkol))}/${encodeURIComponent(String(poradiOsoby))}`,
      e_mail ? { e_mail } : {},
      session.accessToken
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, result: result.data })
  } catch (error) {
    logger.error('Error resending skoleni dotaznik:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

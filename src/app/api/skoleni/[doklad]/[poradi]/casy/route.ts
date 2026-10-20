import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  getSkoleniFetchErrorResponseBody,
  mutateSkoleniCasy,
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

    let body: { zahajeni?: unknown; ukonceni?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const result = await mutateSkoleniCasy(key.doklad, key.poradiSkol, body, session.accessToken)

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, detail: result.detail })
  } catch (error) {
    logger.error('Error updating skoleni casy:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import {
  callSkoleniMutation,
  getSkoleniFetchErrorResponseBody,
  parseSkoleniRouteKey,
} from '@/lib/skoleni-mapper'

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

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

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const jmeno = toTrimmedString(body.jmeno)
    const prijmeni = toTrimmedString(body.prijmeni)
    const e_mail = toTrimmedString(body.e_mail)
    const poznamka = toTrimmedString(body.poznamka)

    if (!jmeno || !prijmeni) {
      return NextResponse.json({ error: 'Jméno a příjmení jsou povinné.' }, { status: 400 })
    }

    const result = await callSkoleniMutation(
      '/osoba/add',
      {
        doklad: key.doklad,
        poradi_skol: key.poradiSkol,
        jmeno,
        prijmeni,
        e_mail,
        poznamka,
      },
      session.accessToken
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.message, message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true, result: result.data })
  } catch (error) {
    logger.error('Error adding skoleni osoba:', error)
    const { status, body } = getSkoleniFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

import { Skoleni } from '@/types/project'

type RawSkoleni = Partial<Record<keyof Skoleni, unknown>>

export function getSkoleniApiUrl() {
  return (
    process.env.SKOLENI_API_URL || 'http://apptest.itman.cz:5500/rest/api/v1/skoleni'
  ).replace(/\/$/, '')
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function mapSkoleni(rawData: unknown): Skoleni[] {
  if (!Array.isArray(rawData)) {
    return []
  }

  return rawData.map((item) => {
    const row = item as RawSkoleni

    return {
      doklad: toStringValue(row.doklad),
      poradi_skol: toNumberValue(row.poradi_skol),
    }
  })
}

export function getSkoleniFetchErrorResponseBody(error: unknown) {
  const cause =
    error instanceof Error && 'cause' in error
      ? (error.cause as { code?: string; hostname?: string } | undefined)
      : undefined
  const networkCodes = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'])

  if (cause?.code && networkCodes.has(cause.code)) {
    const host = cause.hostname || 'apptest.itman.cz'
    return {
      status: 503,
      body: {
        error: 'skoleni_unreachable',
        message: `API školení (${host}) není dostupné. Zkontrolujte připojení k síti.`,
      },
    }
  }

  return {
    status: 500,
    body: { error: 'Failed to fetch skoleni' },
  }
}

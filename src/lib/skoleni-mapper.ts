import {
  Skoleni,
  SkoleniDetail,
  SkoleniExtraField,
  SkoleniUcastnik,
} from '@/types/project'
import { logger } from '@/lib/logger'

type RawRecord = Record<string, unknown>

const SKOLENI_LIST_KEYS = ['doklad', 'poradi_skol', 'nazev_projektu', 'tema', 'skolitel', 'misto', 'datum', 'stav'] as const

const DETAIL_URL_KEYS = [
  'odkaz_anonymni_dotaznik',
  'odkaz_dotaznik_anonym',
  'anonymni_dotaznik',
  'url_anonymni_dotaznik',
  'odkaz_dotaznik',
  'url_dotaznik',
  'dotaznik_url',
  'odkaz',
  'url',
]

const PARTICIPANT_URL_KEYS = [
  'odkaz_dotaznik',
  'url_dotaznik',
  'dotaznik_url',
  'odkaz',
  'url',
]

const EXTRA_FIELD_LABELS: Record<string, string> = {
  doklad: 'Doklad',
  poradi_skol: 'Pořadí školení',
  nazev_projektu: 'Projekt',
  tema: 'Téma',
  skolitel: 'Školitel',
  misto: 'Místo',
  datum: 'Datum',
  stav: 'Stav',
  ucastnik: 'Účastník',
  poradi_osoba: 'Pořadí osoba',
  e_mail: 'E-mail',
  email: 'E-mail',
  poznamka: 'Poznámka',
  ucast: 'Účast',
  dotaznik: 'Dotazník',
  odeslano: 'Odesláno',
  odkaz_anonymni_dotaznik: 'Anonymní dotazník',
  odkaz_dotaznik: 'Odkaz na dotazník',
  url_dotaznik: 'Odkaz na dotazník',
  url: 'Odkaz',
  pocet_ucastniku: 'Počet účastníků',
  pocet_nevyplnenych: 'Počet nevyplněných',
  pocet_vyplnenych: 'Počet vyplněných',
}

const URL_RE = /^https?:\/\//i

export function getSkoleniApiUrl() {
  return (
    process.env.SKOLENI_API_URL || 'http://apptest.itman.cz:5500/rest/api/v1/skoleni'
  ).replace(/\/$/, '')
}

export function buildSkoleniApiUrl(path: string, query?: Record<string, string | number>): string {
  const base = getSkoleniApiUrl()
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : ''
  const url = new URL(`${base}${suffix}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function toStringValue(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'Ano' : 'Ne'
  return ''
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

function toDateValue(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return null

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null

  // ERP placeholder for missing date
  if (parsed.getFullYear() < 1902) return null

  return raw
}

function isPlainRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapRecords(rawData: unknown): RawRecord[] {
  if (Array.isArray(rawData)) {
    return rawData.filter(isPlainRecord)
  }

  if (!isPlainRecord(rawData)) {
    return []
  }

  if (typeof rawData.status === 'string' && rawData.status.toLowerCase() === 'error') {
    return []
  }

  for (const key of ['data', 'detail', 'skoleni', 'ucastnici', 'items', 'result']) {
    const nested = rawData[key]
    if (Array.isArray(nested)) {
      return nested.filter(isPlainRecord)
    }
    if (isPlainRecord(nested)) {
      return [nested]
    }
  }

  return [rawData]
}

function extraFieldLabel(key: string): string {
  return EXTRA_FIELD_LABELS[key] ?? key.replaceAll('_', ' ')
}

function extraFieldFromValue(key: string, value: unknown): SkoleniExtraField | null {
  if (value == null || value === '') return null
  if (typeof value === 'object') return null

  const stringValue = toStringValue(value)
  if (!stringValue) return null

  const href = URL_RE.test(stringValue) ? stringValue : undefined
  return {
    key,
    label: extraFieldLabel(key),
    value: stringValue,
    href,
  }
}

function pickFirstString(row: RawRecord, keys: string[]): string {
  for (const key of keys) {
    if (!(key in row)) continue
    const value = toStringValue(row[key])
    if (value) return value
  }
  return ''
}

function pickFirstUrl(row: RawRecord, keys: string[]): string | null {
  const direct = pickFirstString(row, keys)
  if (direct && URL_RE.test(direct)) return direct

  for (const [key, value] of Object.entries(row)) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (URL_RE.test(trimmed) && /dotaznik|survey|form/i.test(key)) {
      return trimmed
    }
  }

  return direct && URL_RE.test(direct) ? direct : null
}

function remainingExtraFields(row: RawRecord, usedKeys: Set<string>): SkoleniExtraField[] {
  const fields: SkoleniExtraField[] = []

  for (const [key, value] of Object.entries(row)) {
    if (usedKeys.has(key)) continue
    const field = extraFieldFromValue(key, value)
    if (field) fields.push(field)
  }

  return fields
}

export function mapSkoleni(rawData: unknown): Skoleni[] {
  return unwrapRecords(rawData).map(mapSkoleniRow)
}

function mapSkoleniRow(row: RawRecord): Skoleni {
  return {
    doklad: toStringValue(row.doklad),
    poradi_skol: toNumberValue(row.poradi_skol),
    nazev_projektu: pickFirstString(row, ['nazev_projektu', 'nazev_proj', 'projekt_nazev']),
    tema: toStringValue(row.tema),
    skolitel: toStringValue(row.skolitel),
    misto: toStringValue(row.misto),
    datum: toDateValue(row.datum),
    stav: toStringValue(row.stav),
  }
}

export function mapSkoleniDetail(rawData: unknown): SkoleniDetail | null {
  const rows = unwrapRecords(rawData)
  if (rows.length === 0) return null
  return mapSkoleniDetailRow(rows[0])
}

function mapSkoleniDetailRow(row: RawRecord): SkoleniDetail {
  const usedKeys = new Set<string>(SKOLENI_LIST_KEYS)
  const odkaz = pickFirstUrl(row, DETAIL_URL_KEYS)
  for (const key of DETAIL_URL_KEYS) {
    if (key in row) usedKeys.add(key)
  }

  return {
    ...mapSkoleniRow(row),
    odkaz_anonymni_dotaznik: odkaz,
    extraFields: remainingExtraFields(row, usedKeys),
  }
}

export function mapSkoleniUcastnici(rawData: unknown): SkoleniUcastnik[] {
  return unwrapRecords(rawData).map(mapSkoleniUcastnikRow)
}

function mapSkoleniUcastnikRow(row: RawRecord): SkoleniUcastnik {
  const odkaz = pickFirstUrl(row, PARTICIPANT_URL_KEYS)

  return {
    doklad: toStringValue(row.doklad),
    poradi_skol: toNumberValue(row.poradi_skol),
    poradi_osoba: toNumberValue(row.poradi_osoba),
    ucastnik: toStringValue(row.ucastnik),
    e_mail: pickFirstString(row, ['e_mail', 'email']),
    poznamka: toStringValue(row.poznamka),
    ucast: toStringValue(row.ucast),
    dotaznik: toStringValue(row.dotaznik),
    odeslano: pickFirstString(row, ['odeslano', 'odeslano_dotaznik']),
    odkaz_dotaznik: odkaz,
  }
}

export function findSkoleniByKey(items: Skoleni[], doklad: string, poradiSkol: number): Skoleni | null {
  return items.find((item) => item.doklad === doklad && item.poradi_skol === poradiSkol) ?? null
}

export function parseSkoleniRouteKey(dokladRaw: string, poradiRaw: string): { doklad: string; poradiSkol: number } | null {
  const doklad = decodeURIComponent(dokladRaw).trim()
  const poradiSkol = Number(decodeURIComponent(poradiRaw))
  if (!doklad || !Number.isFinite(poradiSkol)) return null
  return { doklad, poradiSkol }
}

export function skoleniFromListItem(item: Skoleni): SkoleniDetail {
  return {
    ...item,
    odkaz_anonymni_dotaznik: null,
    extraFields: [],
  }
}

function pickApiMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  for (const key of ['message', 'Message', 'error', 'Error', 'popis', 'detail']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return fallback
}

function isApiErrorPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const record = data as Record<string, unknown>
  const status = typeof record.status === 'string' ? record.status.toLowerCase() : ''
  const result = typeof record.result === 'string' ? record.result.toLowerCase() : ''
  return status === 'error' || result === 'error' || record.ok === false
}

export async function callSkoleniMutation(
  path: string,
  query: Record<string, string | number | undefined>,
  token?: string
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; message: string }> {
  const filteredQuery: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    filteredQuery[key] = value
  }

  const url = buildSkoleniApiUrl(path, filteredQuery)
  const headers: Record<string, string> = {
    'User-Agent': 'NextJS-Server',
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  logger.log('Calling skoleni mutation:', url)

  const response = await fetch(url, {
    cache: 'no-store',
    headers,
  })

  const text = await response.text()
  let data: unknown = null
  if (text.trim()) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    logger.error('Skoleni mutation failed:', response.status, url)
    return {
      ok: false,
      status: response.status,
      message: pickApiMessage(data, 'Požadavek se nepodařilo odeslat do API školení.'),
    }
  }

  if (isApiErrorPayload(data)) {
    return {
      ok: false,
      status: 400,
      message: pickApiMessage(data, 'API školení vrátilo chybu.'),
    }
  }

  return { ok: true, data }
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

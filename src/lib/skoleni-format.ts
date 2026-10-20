export function formatSkoleniDate(value: string | null | undefined): string {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1902) {
    return '—'
  }

  return parsed.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const SKOLENI_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Wall-clock `yyyy-MM-ddTHH:mm:ss`. Placeholder `1901-01-01` and other shapes return null. */
export function parseSkoleniApiDateTime(value: string | null | undefined): string | null {
  const match = SKOLENI_DATETIME_RE.exec((value ?? '').trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? '00')
  if (year < 1902 || hour > 23 || minute > 59 || second > 59) return null

  const probe = new Date(year, month - 1, day, hour, minute, second)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null
  }

  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
}

export function formatSkoleniDateTime(value: string | null | undefined): string {
  const normalized = parseSkoleniApiDateTime(value)
  if (!normalized) return '—'

  const [date, time] = normalized.split('T')
  const [year, month, day] = date.split('-')
  return `${day}. ${month}. ${year} ${time}`
}

export function skoleniDateTimeInputValue(value: string | null | undefined): string {
  const normalized = parseSkoleniApiDateTime(value)
  return normalized ? normalized.slice(0, 16) : ''
}

export function skoleniTimesFromInputs(input: {
  currentZahajeni: string | null
  currentUkonceni: string | null
  zahajeniInput: string
  ukonceniInput: string
}): { ok: true; body: { zahajeni?: string; ukonceni?: string } } | { ok: false; message: string } {
  const currentZahajeni = parseSkoleniApiDateTime(input.currentZahajeni)
  const currentUkonceni = parseSkoleniApiDateTime(input.currentUkonceni)
  const body: { zahajeni?: string; ukonceni?: string } = {}

  if (input.zahajeniInput !== skoleniDateTimeInputValue(input.currentZahajeni)) {
    if (!input.zahajeniInput.trim()) {
      if (currentZahajeni) return { ok: false, message: 'Zahájení nelze smazat, lze ho jen změnit.' }
    } else {
      const parsed = parseSkoleniApiDateTime(input.zahajeniInput)
      if (!parsed) return { ok: false, message: 'Zahájení nemá platný datum a čas.' }
      body.zahajeni = parsed
    }
  }

  if (input.ukonceniInput !== skoleniDateTimeInputValue(input.currentUkonceni)) {
    if (!input.ukonceniInput.trim()) {
      if (currentUkonceni) return { ok: false, message: 'Ukončení nelze smazat, lze ho jen změnit.' }
    } else {
      const parsed = parseSkoleniApiDateTime(input.ukonceniInput)
      if (!parsed) return { ok: false, message: 'Ukončení nemá platný datum a čas.' }
      body.ukonceni = parsed
    }
  }

  if (!body.zahajeni && !body.ukonceni) {
    return { ok: false, message: 'Žádný čas se nezměnil.' }
  }

  const zahajeni = body.zahajeni ?? currentZahajeni
  const ukonceni = body.ukonceni ?? currentUkonceni
  if (zahajeni && ukonceni && ukonceni < zahajeni) {
    return { ok: false, message: 'Ukončení nesmí být dřív než zahájení.' }
  }

  return { ok: true, body }
}

export function validateSkoleniTimesBody(
  currentZahajeni: string | null,
  currentUkonceni: string | null,
  body: { zahajeni?: unknown; ukonceni?: unknown }
): { ok: true; body: { zahajeni?: string; ukonceni?: string } } | { ok: false; message: string } {
  const next: { zahajeni?: string; ukonceni?: string } = {}

  if ('zahajeni' in body) {
    if (typeof body.zahajeni !== 'string') {
      return { ok: false, message: 'Zahájení musí být ve tvaru yyyy-MM-ddTHH:mm:ss.' }
    }
    const parsed = parseSkoleniApiDateTime(body.zahajeni)
    if (!parsed) return { ok: false, message: 'Zahájení nelze smazat a musí být ve tvaru yyyy-MM-ddTHH:mm:ss.' }
    next.zahajeni = parsed
  }

  if ('ukonceni' in body) {
    if (typeof body.ukonceni !== 'string') {
      return { ok: false, message: 'Ukončení musí být ve tvaru yyyy-MM-ddTHH:mm:ss.' }
    }
    const parsed = parseSkoleniApiDateTime(body.ukonceni)
    if (!parsed) return { ok: false, message: 'Ukončení nelze smazat a musí být ve tvaru yyyy-MM-ddTHH:mm:ss.' }
    next.ukonceni = parsed
  }

  if (!next.zahajeni && !next.ukonceni) {
    return { ok: false, message: 'Je potřeba zadat zahájení nebo ukončení.' }
  }

  const zahajeni = next.zahajeni ?? parseSkoleniApiDateTime(currentZahajeni)
  const ukonceni = next.ukonceni ?? parseSkoleniApiDateTime(currentUkonceni)
  if (zahajeni && ukonceni && ukonceni < zahajeni) {
    return { ok: false, message: 'Ukončení nesmí být dřív než zahájení.' }
  }

  return { ok: true, body: next }
}

export type SkoleniStavPhase = 'planned' | 'started' | 'finished'

function normalizeStavKey(stav: string): string {
  return stav.trim().toLowerCase()
}

export function getSkoleniStavPhase(stav: string | null | undefined): SkoleniStavPhase {
  const normalized = normalizeStavKey(stav ?? '')
  const numeric = Number(normalized)

  if (
    numeric === 30 ||
    numeric === 40 ||
    normalized === 'ukončeno' ||
    normalized === 'ukonceno' ||
    normalized === 'dokončeno' ||
    normalized === 'dokonceno' ||
    normalized === 'uzavřeno' ||
    normalized === 'uzavreno'
  ) {
    return 'finished'
  }

  if (numeric === 20 || normalized === 'zahájeno' || normalized === 'zahajeno') {
    return 'started'
  }

  return 'planned'
}

export function formatSkoleniStav(stav: string | null | undefined): string {
  const raw = (stav ?? '').trim()
  if (!raw) return '—'

  if (/^\d+(\.0+)?$/.test(raw)) {
    const numeric = Number(raw)
    if (numeric === 0) return 'Pořízeno'
    if (numeric === 10) return 'Potvrzeno'
    if (numeric === 20) return 'Zahájeno'
    if (numeric === 30) return 'Ukončeno'
    if (numeric === 40) return 'Uzavřeno'
  }

  return raw
}

export function canStartSkoleni(stav: string | null | undefined): boolean {
  return getSkoleniStavPhase(stav) === 'planned'
}

export function canFinishSkoleni(stav: string | null | undefined): boolean {
  return getSkoleniStavPhase(stav) === 'started'
}

export function getStavBadgeClass(stav: string): string {
  const normalized = normalizeStavKey(stav)
  const phase = getSkoleniStavPhase(stav)

  if (normalized === 'uzavřeno' || normalized === 'uzavreno' || Number(normalized) === 40) {
    return 'bg-slate-800/80 text-slate-200 border-slate-600'
  }
  if (phase === 'finished') {
    return 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
  }
  if (phase === 'started' || normalized === 'zahájeno' || normalized === 'zahajeno') {
    return 'bg-amber-900/60 text-amber-200 border-amber-700'
  }
  if (normalized === 'potvrzeno') {
    return 'bg-green-900/60 text-green-200 border-green-700'
  }
  if (normalized === 'zrušeno' || normalized === 'zruseno') {
    return 'bg-red-900/60 text-red-200 border-red-700'
  }
  if (phase === 'planned' || normalized === 'plánováno' || normalized === 'planovano') {
    return 'bg-blue-900/60 text-blue-200 border-blue-700'
  }

  return 'bg-gray-800/80 text-gray-200 border-gray-600'
}

const UCAST_POSITIVE = new Set([
  'ano',
  'true',
  '1',
  'účast',
  'ucast',
  'přítomen',
  'pritomen',
  'zúčastnil se',
  'zucastnil se',
])

export function isUcastPositive(ucast: string | null | undefined): boolean {
  return UCAST_POSITIVE.has((ucast ?? '').trim().toLowerCase())
}

export function isDotaznikVyplneny(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  return (
    normalized === 'vyplněný' ||
    normalized === 'vyplneny' ||
    normalized === 'vyplněno' ||
    normalized === 'vyplneno' ||
    normalized === 'ano' ||
    normalized === 'true' ||
    normalized === '1'
  )
}

export function isDotaznikOdeslan(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return false
  if (normalized.startsWith('ne')) return false
  return (
    normalized === 'odeslán' ||
    normalized === 'odeslan' ||
    normalized === 've frontě' ||
    normalized === 've fronte' ||
    normalized === 'ano' ||
    normalized === 'true' ||
    normalized === '1' ||
    normalized === '2'
  )
}

export function getOdeslanoBadgeClass(value: string): string {
  const normalized = (value ?? '').trim().toLowerCase()
  if (normalized === 've frontě' || normalized === 've fronte') {
    return 'bg-amber-900/60 text-amber-200 border-amber-700'
  }
  if (isDotaznikOdeslan(value)) {
    return 'bg-green-900/60 text-green-200 border-green-700'
  }
  return 'bg-gray-800/80 text-gray-200 border-gray-600'
}

export function displayText(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed || '—'
}

export function skoleniDetailPath(doklad: string, poradiSkol: number | string): string {
  return `/evidence-skoleni/${encodeURIComponent(doklad)}/${encodeURIComponent(String(poradiSkol))}`
}

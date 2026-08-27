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

export type SkoleniStavPhase = 'planned' | 'started' | 'finished'

function normalizeStavKey(stav: string): string {
  return stav.trim().toLowerCase()
}

export function getSkoleniStavPhase(stav: string | null | undefined): SkoleniStavPhase {
  const normalized = normalizeStavKey(stav ?? '')
  const numeric = Number(normalized)

  if (
    numeric === 30 ||
    normalized === 'ukončeno' ||
    normalized === 'ukonceno' ||
    normalized === 'dokončeno' ||
    normalized === 'dokonceno'
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

  const phase = getSkoleniStavPhase(raw)
  if (/^\d+(\.0+)?$/.test(raw)) {
    if (phase === 'finished') return 'Ukončeno'
    if (phase === 'started') return 'Zahájeno'
    if (Number(raw) === 10) return 'Plánováno'
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

export function displayText(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed || '—'
}

export function skoleniDetailPath(doklad: string, poradiSkol: number | string): string {
  return `/evidence-skoleni/${encodeURIComponent(doklad)}/${encodeURIComponent(String(poradiSkol))}`
}

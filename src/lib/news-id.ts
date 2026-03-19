import crypto from 'crypto'

export type ErpNewsIdInput = {
  id?: string
  news_id?: string
  newsId?: string
  nadpis?: string
  title?: string
  titulek?: string
  obsah?: string
  obsah_html?: string
  obsahHtml?: string
  html_obsah?: string
  htmlObsah?: string
  body?: string
  body_html?: string
  bodyHtml?: string
  html?: string
  content?: string
  projekt?: string
  project?: string
  projekt_nazev?: string
  projektNazev?: string
  projectName?: string
  datum?: string
  date?: string
  created_at?: string
  createdAt?: string
  vytvoreno?: string
  datum_vlozeni?: string
  datumVlozeni?: string
}

function firstString(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return undefined
}

function stableIdFromParts(parts: Array<string | undefined>): string {
  const base = parts.filter(Boolean).join('|').trim()
  return crypto.createHash('sha1').update(base || crypto.randomUUID()).digest('hex').slice(0, 16)
}

function extractDatumIso(raw: Record<string, unknown>): string | undefined {
  const d = firstString(raw, ['datum', 'date', 'created_at', 'createdAt', 'vytvoreno', 'datum_vlozeni', 'datumVlozeni'])
  if (!d) return undefined
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export function computeErpNewsId(raw: ErpNewsIdInput): string {
  const r = raw as unknown as Record<string, unknown>
  const explicitId = firstString(r, ['id', 'news_id', 'newsId'])
  if (explicitId) return explicitId

  const nadpis = firstString(r, ['nadpis', 'title', 'titulek']) ?? ''
  const obsah =
    firstString(r, [
      'obsah',
      'obsah_html',
      'obsahHtml',
      'html_obsah',
      'htmlObsah',
      'body',
      'body_html',
      'bodyHtml',
      'html',
      'content',
    ]) ?? ''
  const projekt = firstString(r, ['projekt', 'project']) ?? undefined
  const projektNazev = firstString(r, ['projekt_nazev', 'projektNazev', 'projectName']) ?? undefined
  const datum = extractDatumIso(r)

  return stableIdFromParts([nadpis, datum, projekt, projektNazev, obsah])
}


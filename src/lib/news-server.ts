import 'server-only'

import { logger } from '@/lib/logger'
import type { PolozkaAktualita } from '@/types/dashboard'
import { computeErpNewsId } from '@/lib/news-id'

type ErpNewsRaw = Record<string, unknown>

function normalizeErpBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/web') ? trimmed.slice(0, -4) : trimmed
}

function firstString(raw: ErpNewsRaw, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return undefined
}

function valueLength(raw: ErpNewsRaw, key: string): number | null {
  const v = raw[key]
  if (typeof v === 'string') return v.length
  return null
}

function firstBoolean(raw: ErpNewsRaw, keys: string[]): boolean | undefined {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v === 1
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase()
      if (s === 'true' || s === '1' || s === 'ano') return true
      if (s === 'false' || s === '0' || s === 'ne') return false
    }
  }
  return undefined
}

function extractDatumIso(raw: ErpNewsRaw): string | undefined {
  const d = firstString(raw, ['datum', 'date', 'created_at', 'createdAt', 'vytvoreno', 'datum_vlozeni', 'datumVlozeni'])
  if (!d) return undefined
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

function normalizeNewsItem(raw: ErpNewsRaw, idx: number): PolozkaAktualita {
  const nadpis = firstString(raw, ['nadpis', 'title', 'titulek']) ?? ''
  const obsah =
    firstString(raw, [
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
  const projekt = firstString(raw, ['projekt', 'project']) ?? undefined
  const projekt_nazev = firstString(raw, ['projekt_nazev', 'projektNazev', 'projectName']) ?? undefined
  const datum = extractDatumIso(raw)
  const vip = firstBoolean(raw, ['vip', 'important', 'dulezite']) ?? undefined
  const id = computeErpNewsId({
    id: typeof raw.id === 'string' ? raw.id : undefined,
    news_id: typeof (raw as any).news_id === 'string' ? (raw as any).news_id : undefined,
    newsId: typeof (raw as any).newsId === 'string' ? (raw as any).newsId : undefined,
    nadpis,
    obsah,
    projekt,
    projekt_nazev,
    datum: datum ?? undefined,
  })

  return {
    id: String(id),
    nadpis: String(nadpis),
    obsah,
    datum,
    projekt,
    projekt_nazev,
    vip,
  }
}

async function fetchErpNewsRaw(): Promise<ErpNewsRaw[]> {
  const erpBase = normalizeErpBaseUrl(process.env.ERP_API_URL || 'http://itmsql01:44612')
  const url = `${erpBase}/web/news`

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  })

  if (!response.ok) {
    logger.error('ERP news error:', response.status, response.statusText)
    throw new Error(`ERP error: ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

async function fetchErpNews(): Promise<PolozkaAktualita[]> {
  const rawItems = await fetchErpNewsRaw()
  return rawItems.map((r, idx) => normalizeNewsItem(r, idx))
}

function sortByNewest(items: PolozkaAktualita[]): PolozkaAktualita[] {
  return [...items].sort((a, b) => {
    const ad = a.datum ? new Date(a.datum).getTime() : 0
    const bd = b.datum ? new Date(b.datum).getTime() : 0
    return bd - ad
  })
}

export type NewsListItem = Pick<PolozkaAktualita, 'id' | 'nadpis' | 'datum' | 'projekt' | 'projekt_nazev' | 'vip'>

export async function getNewsList(): Promise<NewsListItem[]> {
  const all = await fetchErpNews()
  return sortByNewest(all).map(({ id, nadpis, datum, projekt, projekt_nazev, vip }) => ({
    id,
    nadpis,
    datum,
    projekt,
    projekt_nazev,
    vip,
  }))
}

export async function getNewsDetail({ id }: { id: string }): Promise<PolozkaAktualita | null> {
  const debug = process.env.NEWS_FORENSICS === '1'

  if (!debug) {
    const all = await fetchErpNews()
    const match = all.find((i) => i.id === id)
    return match ?? null
  }

  const rawItems = await fetchErpNewsRaw()
  for (let idx = 0; idx < rawItems.length; idx++) {
    const raw = rawItems[idx] ?? {}
    const normalized = normalizeNewsItem(raw, idx)
    if (normalized.id !== id) continue

    const keys = Object.keys(raw)
    const htmlKeys = [
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
    ]

    logger.info('NEWS_FORENSICS detail', {
      id,
      rawKeys: keys.slice(0, 40),
      rawHtmlLengths: Object.fromEntries(htmlKeys.map((k) => [k, valueLength(raw, k)])),
      normalizedObsahLength: normalized.obsah?.length ?? 0,
    })

    return normalized
  }

  logger.info('NEWS_FORENSICS detail not found', { id, rawCount: rawItems.length })
  return null
}


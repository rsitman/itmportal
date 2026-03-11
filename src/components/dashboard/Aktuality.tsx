'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import type { PolozkaAktualita } from '@/types/dashboard'
import SekceDashboardu from './SekceDashboardu'

const MAX_ITEMS = 8

const NEWS_ALLOWED_TAGS = ['b', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'p'] as const
const NEWS_ALLOWED_ATTR = ['href', 'target', 'rel', 'title'] as const

function sortItems(items: PolozkaAktualita[]): PolozkaAktualita[] {
  const vip = items.filter((i) => i.vip)
  const rest = items.filter((i) => !i.vip)
  return [...vip, ...rest].slice(0, MAX_ITEMS)
}

function NewsContent({ html }: { html: string }) {
  const safeHtml = useMemo(() => {
    if (!html) return ''

    const normalized = html.replace(/\r\n/g, '\n')
    const withBreaks = normalized.replace(/\n/g, '<br />')

    return DOMPurify.sanitize(withBreaks, {
      ALLOWED_TAGS: NEWS_ALLOWED_TAGS as unknown as string[],
      ALLOWED_ATTR: NEWS_ALLOWED_ATTR as unknown as string[],
    })
  }, [html])

  if (!safeHtml) {
    return null
  }

  return (
    <div
      className="aktualita-content text-sm text-gray-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}

export default function Aktuality() {
  const [items, setItems] = useState<PolozkaAktualita[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/news')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setItems(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Chyba načtení')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <SekceDashboardu title="Aktuality">
      {loading && (
        <p className="text-sm text-gray-400 py-4">Načítání…</p>
      )}
      {error && !loading && (
        <p className="text-sm text-gray-400 py-4" role="status">
          Aktuality momentálně nelze načíst.
        </p>
      )}
      {!loading && !error && items !== null && items.length === 0 && (
        <p className="text-sm text-gray-400 py-4">Žádné aktuality.</p>
      )}
      {!loading && !error && items !== null && items.length > 0 && (
        <ul className="divide-y divide-gray-700/50">
          {sortItems(items).map((p, idx) => {
            const hasProjekt = p.projekt_nazev && p.projekt_nazev.trim() !== ''
            const isVip = p.vip === true
            return (
              <li
                key={`${idx}-${p.nadpis ?? ''}`}
                className={`py-3 first:pt-0 last:pb-0 ${
                  isVip ? 'border-l-2 border-l-amber-500/50 pl-3 -ml-px' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  {isVip && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-400/70 font-medium">
                      Důležité
                    </span>
                  )}
                  <p className="font-medium text-white">{p.nadpis}</p>
                  {p.obsah && <NewsContent html={p.obsah} />}
                  {hasProjekt && (
                    <span
                      className="text-xs text-gray-500 mt-1 inline-block"
                      aria-label={`Projekt: ${p.projekt_nazev}`}
                    >
                      {p.projekt_nazev}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </SekceDashboardu>
  )
}

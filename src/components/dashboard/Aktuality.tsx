'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { PolozkaAktualita } from '@/types/dashboard'
import SekceDashboardu from './SekceDashboardu'

const MAX_ITEMS = 4

function sortItems(items: PolozkaAktualita[]): PolozkaAktualita[] {
  return [...items]
    .sort((a, b) => {
      const ad = a.datum ? new Date(a.datum).getTime() : 0
      const bd = b.datum ? new Date(b.datum).getTime() : 0
      return bd - ad
    })
    .slice(0, MAX_ITEMS)
}

function formatDateShort(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    <SekceDashboardu
      id="aktuality"
      title="Aktuality"
      action={
        <Link
          href="/aktuality"
          className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4"
        >
          Všechny aktuality
        </Link>
      }
    >
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
          {sortItems(items).map((p) => {
            const hasProjekt = p.projekt_nazev && p.projekt_nazev.trim() !== ''
            return (
              <li
                key={p.id}
                className="py-3 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/aktuality/${encodeURIComponent(p.id)}`}
                  className="block rounded-md px-2 py-2 -mx-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-white leading-snug line-clamp-2">{p.nadpis}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs text-gray-400">{formatDateShort(p.datum)}</span>
                      {hasProjekt ? (
                        <span className="text-xs text-gray-400">
                          <span className="text-gray-600">•</span> {p.projekt_nazev}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </SekceDashboardu>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { PolozkaAktualita } from '@/types/dashboard'
import SekceDashboardu from './SekceDashboardu'

const MAX_ITEMS = 8

function sortItems(items: PolozkaAktualita[]): PolozkaAktualita[] {
  const vip = items.filter((i) => i.vip)
  const rest = items.filter((i) => !i.vip)
  return [...vip, ...rest].slice(0, MAX_ITEMS)
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
        <ul className="space-y-4">
          {sortItems(items).map((p, idx) => {
            const hasProjekt = p.projekt_nazev && p.projekt_nazev.trim() !== ''
            const isVip = p.vip === true
            return (
              <li
                key={`${idx}-${p.nadpis ?? ''}`}
                className={`border-b border-gray-700/60 last:border-0 pb-4 last:pb-0 last:mb-0 ${
                  isVip ? 'border-l-2 border-l-amber-500/60 pl-3 ml-1 bg-amber-950/20 rounded-r' : ''
                }`}
              >
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-white">{p.nadpis}</p>
                  {p.obsah && (
                    <p className="text-sm text-gray-400">{p.obsah}</p>
                  )}
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

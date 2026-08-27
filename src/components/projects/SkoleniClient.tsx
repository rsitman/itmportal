'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Skoleni } from '@/types/project'
import { logger } from '@/lib/logger'
import {
  displayText,
  formatSkoleniDate,
  formatSkoleniStav,
  getStavBadgeClass,
  skoleniDetailPath,
} from '@/lib/skoleni-format'

interface SkoleniClientProps {
  endpoint: string
  title: string
  description: string
  emptyMessage: string
  showDokladColumn?: boolean
  initialDoklad?: string
}

function getDatumSortKey(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1902) {
    return Number.MAX_SAFE_INTEGER
  }

  return parsed.getTime()
}

export default function SkoleniClient({
  endpoint,
  title,
  description,
  emptyMessage,
  showDokladColumn = true,
  initialDoklad = '',
}: SkoleniClientProps) {
  const [items, setItems] = useState<Skoleni[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [dokladFilter, setDokladFilter] = useState(initialDoklad)

  const returnTo = useMemo(() => {
    const qs = searchParams.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }, [pathname, searchParams])

  const fetchSkoleni = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(endpoint)

      if (!response.ok) {
        let errorBody: { message?: string; error?: string } | null = null
        try {
          errorBody = await response.clone().json()
        } catch {
          errorBody = null
        }
        setError(errorBody?.message || 'Nepodařilo se načíst evidenci školení.')
        return
      }

      const data = await response.json()
      setItems(Array.isArray(data) ? data : data.skoleni || [])
    } catch (fetchError) {
      logger.error('Error fetching skoleni:', fetchError)
      setError('Došlo k chybě při načítání evidence školení.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchSkoleni()
  }, [fetchSkoleni])

  const dokladOptions = useMemo(() => {
    const byDoklad = new Map<string, string>()
    for (const item of items) {
      if (!item.doklad) continue
      if (!byDoklad.has(item.doklad)) {
        byDoklad.set(item.doklad, item.nazev_projektu.trim() || item.doklad)
      }
    }
    return [...byDoklad.entries()].sort((a, b) => a[1].localeCompare(b[1], 'cs'))
  }, [items])

  const filteredItems = items
    .filter((item) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        item.doklad.toLowerCase().includes(normalizedSearch) ||
        item.nazev_projektu.toLowerCase().includes(normalizedSearch) ||
        String(item.poradi_skol).includes(normalizedSearch) ||
        item.tema.toLowerCase().includes(normalizedSearch) ||
        item.skolitel.toLowerCase().includes(normalizedSearch) ||
        item.misto.toLowerCase().includes(normalizedSearch) ||
        item.stav.toLowerCase().includes(normalizedSearch) ||
        formatSkoleniDate(item.datum).toLowerCase().includes(normalizedSearch)

      const matchesDoklad = !dokladFilter || item.doklad === dokladFilter

      return matchesSearch && matchesDoklad
    })
    .sort((first, second) => {
      const projectCompare = (first.nazev_projektu || first.doklad).localeCompare(
        second.nazev_projektu || second.doklad,
        'cs',
      )
      if (projectCompare !== 0) {
        return projectCompare
      }

      const dateCompare = getDatumSortKey(first.datum) - getDatumSortKey(second.datum)
      if (dateCompare !== 0) {
        return dateCompare
      }

      return first.poradi_skol - second.poradi_skol
    })

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-gray-300 mt-2">{description}</p>
        </div>
        <button
          onClick={fetchSkoleni}
          className="self-start px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Obnovit
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 rounded-md p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-professional p-4">
          <div className="text-2xl font-bold text-white">{items.length}</div>
          <div className="text-sm text-gray-400">Celkem školení</div>
        </div>
      </div>

      <div className="mb-6 card-professional p-4">
        <div className={`grid grid-cols-1 gap-4 ${showDokladColumn ? 'md:grid-cols-3' : ''}`}>
          <div className={showDokladColumn ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="skoleni-search">
              Hledat
            </label>
            <input
              id="skoleni-search"
              type="text"
              placeholder={
                showDokladColumn
                  ? 'Projekt, téma, školitel, místo, stav...'
                  : 'Téma, školitel, místo, stav...'
              }
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {showDokladColumn && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="skoleni-doklad">
                Projekt
              </label>
              <select
                id="skoleni-doklad"
                value={dokladFilter}
                onChange={(event) => setDokladFilter(event.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Všechny projekty</option>
                {dokladFilter && !dokladOptions.some(([doklad]) => doklad === dokladFilter) ? (
                  <option value={dokladFilter}>{dokladFilter}</option>
                ) : null}
                {dokladOptions.map(([doklad, nazev]) => (
                  <option key={doklad} value={doklad}>
                    {nazev}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/80">
              <tr>
                {showDokladColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Projekt
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Téma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Školitel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Místo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Stav
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item, index) => {
                const detailHref = `${skoleniDetailPath(item.doklad, item.poradi_skol)}?returnTo=${encodeURIComponent(returnTo)}`

                const openDetail = (event: MouseEvent | KeyboardEvent) => {
                  if ('metaKey' in event && (event.metaKey || event.ctrlKey)) {
                    window.open(detailHref, '_blank', 'noopener,noreferrer')
                    return
                  }
                  router.push(detailHref)
                }

                return (
                <tr
                  key={`${item.doklad}-${item.poradi_skol}-${index}`}
                  className="hover:bg-gray-800/60 cursor-pointer"
                  tabIndex={0}
                  role="link"
                  aria-label={`Otevřít detail školení ${item.tema.trim() || item.poradi_skol}`}
                  onClick={openDetail}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDetail(event)
                    }
                  }}
                >
                  {showDokladColumn && (
                    <td className="px-6 py-4 text-sm text-gray-200">
                      {item.nazev_projektu.trim() || item.doklad || '—'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {item.tema.trim() || 'Bez tématu'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">{displayText(item.skolitel)}</td>
                  <td className="px-6 py-4 text-sm text-gray-200">{displayText(item.misto)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {formatSkoleniDate(item.datum)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.stav ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${getStavBadgeClass(item.stav)}`}
                      >
                        {formatSkoleniStav(item.stav)}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchTerm || dokladFilter
            ? 'Nebyly nalezeny žádné záznamy odpovídající filtrům.'
            : emptyMessage}
        </div>
      )}
    </div>
  )
}

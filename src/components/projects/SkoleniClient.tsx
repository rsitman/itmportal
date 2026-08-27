'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Skoleni } from '@/types/project'
import { logger } from '@/lib/logger'

interface SkoleniClientProps {
  endpoint: string
  title: string
  description: string
  emptyMessage: string
  showDokladColumn?: boolean
  initialDoklad?: string
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
  const [searchTerm, setSearchTerm] = useState('')
  const [dokladFilter, setDokladFilter] = useState(initialDoklad)

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
    return [...new Set(items.map((item) => item.doklad).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'cs'),
    )
  }, [items])

  const filteredItems = items
    .filter((item) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        item.doklad.toLowerCase().includes(normalizedSearch) ||
        String(item.poradi_skol).includes(normalizedSearch)

      const matchesDoklad = !dokladFilter || item.doklad === dokladFilter

      return matchesSearch && matchesDoklad
    })
    .sort((first, second) => {
      const dokladCompare = first.doklad.localeCompare(second.doklad, 'cs')
      if (dokladCompare !== 0) {
        return dokladCompare
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
              placeholder={showDokladColumn ? 'Doklad, pořadí školení...' : 'Pořadí školení...'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {showDokladColumn && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="skoleni-doklad">
                Doklad
              </label>
              <select
                id="skoleni-doklad"
                value={dokladFilter}
                onChange={(event) => setDokladFilter(event.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Všechny doklady</option>
                {dokladFilter && !dokladOptions.includes(dokladFilter) ? (
                  <option value={dokladFilter}>{dokladFilter}</option>
                ) : null}
                {dokladOptions.map((doklad) => (
                  <option key={doklad} value={doklad}>
                    {doklad}
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
                    Doklad
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pořadí školení
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item, index) => (
                <tr key={`${item.doklad}-${item.poradi_skol}-${index}`} className="hover:bg-gray-800/60">
                  {showDokladColumn && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">
                      {item.doklad ? (
                        <Link
                          href={`/projects/doklad-projektu/${encodeURIComponent(item.doklad)}`}
                          className="group inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300 group-hover:text-gray-100 group-hover:underline transition-colors">
                            {item.doklad}
                          </span>
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {item.poradi_skol}
                  </td>
                </tr>
              ))}
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

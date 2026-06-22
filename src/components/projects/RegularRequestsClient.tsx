'use client'

import { useCallback, useEffect, useState } from 'react'
import { RegularRequest } from '@/types/project'
import { logger } from '@/lib/logger'
import { jiraIssueUrl } from '@/lib/jira'

const linkBase =
  'group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanLinkMuted =
  'text-gray-400 transition-colors duration-150 group-hover:text-gray-200'

function getJiraHref(issueKey: string | null | undefined): string | null {
  const key = (issueKey ?? '').toString().trim()
  if (!key) return null
  return jiraIssueUrl(key)
}

interface RegularRequestsClientProps {
  endpoint: string
  title: string
  description: string
  emptyMessage: string
  showProjectColumn?: boolean
}

type RequestTypeFilter = '' | RegularRequest['typ_poz']

export default function RegularRequestsClient({
  endpoint,
  title,
  description,
  emptyMessage,
  showProjectColumn = true,
}: RegularRequestsClientProps) {
  const [requests, setRequests] = useState<RegularRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<RequestTypeFilter>('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(endpoint)

      if (!response.ok) {
        let errorBody: { message?: string; error?: string } | null = null
        try { errorBody = await response.clone().json() } catch { errorBody = null }
        setError(errorBody?.message || 'Nepodařilo se načíst pravidelné požadavky.')
        return
      }

      const data = await response.json()
      setRequests(Array.isArray(data) ? data : data.requests || [])
    } catch (error) {
      logger.error('Error fetching regular requests:', error)
      setError('Došlo k chybě při načítání pravidelných požadavků.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const filteredRequests = requests
    .filter((request) => {
      const normalizedSearch = searchTerm.toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        request.projekt.toLowerCase().includes(normalizedSearch) ||
        request.projekt_nazev.toLowerCase().includes(normalizedSearch) ||
        request.jira_klic.toLowerCase().includes(normalizedSearch) ||
        request.nazev.toLowerCase().includes(normalizedSearch)

      const matchesType = !filterType || request.typ_poz === filterType

      return matchesSearch && matchesType
    })
    .sort((first, second) => {
      const projectCompare = first.projekt.localeCompare(second.projekt, 'cs')

      if (projectCompare !== 0) {
        return projectCompare
      }

      return first.nazev.localeCompare(second.nazev, 'cs')
    })

  const serviceCount = requests.filter((request) => request.typ_poz === 'SERVIS').length
  const univykazCount = requests.filter((request) => request.typ_poz === 'UNIVYKAZ').length

  const getTypeBadgeClass = (type: RegularRequest['typ_poz']) => {
    if (type === 'UNIVYKAZ') {
      return 'bg-purple-900/60 text-purple-200 border-purple-700'
    }

    return 'bg-green-900/60 text-green-200 border-green-700'
  }

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
          onClick={fetchRequests}
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
          <div className="text-2xl font-bold text-white">{requests.length}</div>
          <div className="text-sm text-gray-400">Celkem požadavků</div>
        </div>
        <div className="card-professional p-4">
          <div className="text-2xl font-bold text-green-400">{serviceCount}</div>
          <div className="text-sm text-gray-400">Servis</div>
        </div>
        <div className="card-professional p-4">
          <div className="text-2xl font-bold text-purple-400">{univykazCount}</div>
          <div className="text-sm text-gray-400">Univerzální výkaz</div>
        </div>
      </div>

      <div className="mb-6 card-professional p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hledat
            </label>
            <input
              type="text"
              placeholder="Projekt, název projektu, Jira, název požadavku..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Typ požadavku
            </label>
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value as RequestTypeFilter)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Všechny typy</option>
              <option value="SERVIS">Servis</option>
              <option value="UNIVYKAZ">Univerzální výkaz</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/80">
              <tr>
                {showProjectColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Projekt
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Název projektu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jira
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Název požadavku
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRequests.map((request, index) => {
                const jiraHref = getJiraHref(request.jira_klic)

                return (
                <tr
                  key={`${request.projekt}-${request.jira_klic}-${index}`}
                  className="hover:bg-gray-800/60"
                >
                  {showProjectColumn && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">
                      {request.projekt}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {request.projekt_nazev}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${getTypeBadgeClass(request.typ_poz)}`}>
                      {request.typ_poz}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {jiraHref ? (
                      <a
                        href={jiraHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${linkBase} -ml-1`}
                      >
                        <span className="inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/40 px-2 py-1 text-[11px] font-medium font-mono leading-tight">
                          <span className={spanLinkMuted}>{request.jira_klic}</span>
                        </span>
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-gray-500">{request.jira_klic || '—'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {request.nazev}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchTerm || filterType
            ? 'Nebyly nalezeny žádné požadavky odpovídající filtrům.'
            : emptyMessage}
        </div>
      )}
    </div>
  )
}

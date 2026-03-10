'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ServiceProject } from '@/types/project'
import { logger } from '@/lib/logger'

type SortKey = 'nazev'
type SortDirection = 'asc' | 'desc'

function normalize(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toLowerCase()
}

function sortProjects(
  projects: ServiceProject[],
  sortKey: SortKey,
  direction: SortDirection,
): ServiceProject[] {
  const dir = direction === 'asc' ? 1 : -1
  return [...projects].sort((a, b) => {
    const av = normalize(a[sortKey])
    const bv = normalize(b[sortKey])
    return av.localeCompare(bv, 'cs') * dir
  })
}

function AkceProjektu({ project }: { project: ServiceProject }) {
  const dokladProjektu = project.doklad_proj
  const nazevFirmy = project.nazev_par

  const patchUrl = `/plan_patchovani?q=${encodeURIComponent(nazevFirmy)}`
  const teamUrl = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/team`
  const extcompsUrl = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/extcomps`
  const dbUrl = `/databases?projekt=${encodeURIComponent(dokladProjektu)}`
  const upgradesUrl = `/upgrades?projekt=${encodeURIComponent(dokladProjektu)}`
  const hwswUrl = `/hwsw-config?projekt=${encodeURIComponent(dokladProjektu)}`

  const hasJira = Boolean(project.jira_klic && project.jira_klic.trim())
  const hasGps = Boolean(project.gps && project.gps.trim())
  const jiraUrl = hasJira ? `https://itmancz.atlassian.net/browse/${project.jira_klic}` : null
  const mapUrl = hasGps ? `https://www.google.com/maps?q=${encodeURIComponent(project.gps)}` : null

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Primární akce */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Link
          href={`/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}`}
          className="px-3 py-1 text-sm font-medium bg-gray-700 text-gray-100 rounded hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          Detail
        </Link>
        <Link
          href={teamUrl}
          className="px-3 py-1 text-sm font-medium bg-gray-700 text-gray-100 rounded hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          Tým
        </Link>
        <Link
          href={extcompsUrl}
          className="px-3 py-1 text-sm font-medium bg-gray-700 text-gray-100 rounded hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          Externí komponenty
        </Link>
        {jiraUrl ? (
          <a
            href={jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm font-medium bg-gray-700 text-gray-100 rounded hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
          >
            Helpdesk
          </a>
        ) : (
          <span className="px-3 py-1 text-sm bg-gray-800 text-gray-500 rounded border border-gray-700 cursor-not-allowed">
            Helpdesk
          </span>
        )}
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm font-medium bg-gray-700 text-gray-100 rounded hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
          >
            Mapa
          </a>
        ) : (
          <span className="px-3 py-1 text-sm bg-gray-800 text-gray-500 rounded border border-gray-700 cursor-not-allowed">
            Mapa
          </span>
        )}
      </div>

      {/* Sekundární odkazy */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end text-sm">
        <Link
          href={patchUrl}
          className="text-gray-300 hover:text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          Patchování
        </Link>
        <Link
          href={upgradesUrl}
          className="text-gray-300 hover:text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          Upgrady
        </Link>
        <Link
          href={dbUrl}
          className="text-gray-300 hover:text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          Stav DB
        </Link>
        <Link
          href={hwswUrl}
          className="text-gray-300 hover:text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          HW/SW konfigurace
        </Link>
      </div>
    </div>
  )
}

export default function ProjectsRegistryClient() {
  const [serviceProjects, setServiceProjects] = useState<ServiceProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nazev')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const serviceResponse = await fetch('/api/service-projects')
      if (!serviceResponse.ok) {
        throw new Error(`Nepodařilo se načíst projekty (${serviceResponse.status})`)
      }

      const serviceData = await serviceResponse.json()
      setServiceProjects(serviceData)
    } catch (e: any) {
      logger.error('Error fetching service projects:', e)
      setError(e?.message ?? 'Došlo k chybě při načítání dat')
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const base = q
      ? serviceProjects.filter(
          (p) =>
            normalize(p.nazev).includes(q) ||
            normalize(p.doklad_proj).includes(q) ||
            normalize(p.jira_klic).includes(q) ||
            normalize(p.nazev_par).includes(q) ||
            normalize(p.gps).includes(q),
        )
      : serviceProjects

    return sortProjects(base, sortKey, sortDirection)
  }, [serviceProjects, searchTerm, sortKey, sortDirection])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
      return
    }
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-16 bg-gray-800 rounded mb-6 border border-gray-700"></div>
        <div className="h-64 bg-gray-800 rounded border border-gray-700"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/60 border border-red-700/50 rounded-md p-6 shadow-soft">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-sm font-semibold text-red-50 mb-1">Chyba při načítání</h3>
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (serviceProjects.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-md p-6">
        <h3 className="text-sm font-medium text-green-400 mb-2">Žádné servisní projekty</h3>
        <p className="text-gray-300">Nebyly nalezeny žádné servisní projekty.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Souhrn + toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-gray-300 leading-relaxed">
            Zobrazeno <span className="font-semibold text-white">{filteredProjects.length}</span> z{' '}
            <span className="font-semibold text-white">{serviceProjects.length}</span> projektů
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat: projekt, doklad, firma, JIRA, GPS…"
              className="w-full sm:w-[460px] pl-4 pr-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm.trim() ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-md hover:bg-gray-600 transition-colors"
            >
              Vymazat
            </button>
          ) : null}
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Obnovit
          </button>
        </div>
      </div>

      {/* Tabulka */}
      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort('nazev')}
                    className="inline-flex items-center gap-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                  >
                    Projekt
                    {sortKey === 'nazev' ? (sortDirection === 'asc' ? '↑' : '↓') : null}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wide border-b border-gray-700"
                >
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {filteredProjects.map((project, index) => (
                <tr
                  key={`${project.doklad_proj || 'no-id'}-${index}`}
                  className="hover:bg-gray-800"
                >
                  <td className="px-6 py-4 text-sm text-white border-b border-gray-700">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/projects/doklad-projektu/${encodeURIComponent(project.doklad_proj)}`}
                        className="text-base font-semibold text-green-300 hover:text-green-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                      >
                        {project.nazev || '—'}
                      </Link>
                      <div className="text-sm text-gray-300">
                        {project.nazev_par || '—'}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-500">Doklad</span>
                          <span className="font-mono text-gray-300">{project.doklad_proj || '—'}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white border-b border-gray-700 align-top">
                    <AkceProjektu project={project} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProjects.length === 0 && searchTerm.trim() ? (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6">
          <h3 className="text-sm font-semibold text-white mb-1">Žádné výsledky</h3>
          <p className="text-sm text-gray-300 mb-4">
            Pro zadaný dotaz nebyly nalezeny žádné projekty.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors"
            >
              Vymazat hledání
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ServiceProject } from '@/types/project'
import { logger } from '@/lib/logger'
import ProjectLogo from './ProjectLogo'
import { jiraIssueUrl } from '@/lib/jira'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

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

const chipBase =
  'inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
const chipSecondary =
  'inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded-md border border-blue-500/25 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/35 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
const chipDisabled =
  'inline-flex items-center justify-center px-2.5 py-1.5 text-xs rounded-md bg-gray-800/40 border border-gray-700/40 text-gray-500 cursor-not-allowed'

function AkceProjektu({ project, returnTo }: { project: ServiceProject; returnTo: string }) {
  const dokladProjektu = project.doklad_proj
  const nazevFirmy = project.nazev_par

  const patchUrl = `/plan_patchovani?projekt=${encodeURIComponent(dokladProjektu)}&q=${encodeURIComponent(nazevFirmy)}&returnTo=${encodeURIComponent(returnTo)}`
  const teamUrl = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/team?returnTo=${encodeURIComponent(returnTo)}`
  const extcompsUrl = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/extcomps?returnTo=${encodeURIComponent(returnTo)}`
  const dbUrl = `/databases?projekt=${encodeURIComponent(dokladProjektu)}&returnTo=${encodeURIComponent(returnTo)}`
  const upgradesUrl = `/upgrades?projekt=${encodeURIComponent(dokladProjektu)}&returnTo=${encodeURIComponent(returnTo)}`
  const hwswUrl = `/hwsw-config?projekt=${encodeURIComponent(dokladProjektu)}&returnTo=${encodeURIComponent(returnTo)}`

  const hasJira = Boolean(project.jira_klic && project.jira_klic.trim())
  const hasGps = Boolean(project.gps && project.gps.trim())
  const jiraUrl = hasJira ? jiraIssueUrl(project.jira_klic) : null
  const mapUrl = hasGps ? `https://www.google.com/maps?q=${encodeURIComponent(project.gps)}` : null

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <div className="flex flex-wrap gap-1.5 justify-end">
        <Link href={teamUrl} className={`${chipBase} chip-action chip-action-top`}>
          <span className="chip-action-label chip-action-label-top text-gray-300">Tým</span>
        </Link>
        <Link href={extcompsUrl} className={`${chipBase} chip-action chip-action-top`}>
          <span className="chip-action-label chip-action-label-top text-gray-300">
            Externí komponenty
          </span>
        </Link>
        {jiraUrl ? (
          <a
            href={jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chipBase} chip-action chip-action-top`}
          >
            <span className="chip-action-label chip-action-label-top text-gray-300">Helpdesk</span>
          </a>
        ) : (
          <span className={chipDisabled}>Helpdesk</span>
        )}
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chipBase} chip-action chip-action-top`}
          >
            <span className="chip-action-label chip-action-label-top text-gray-300">Mapa</span>
          </a>
        ) : (
          <span className={chipDisabled}>Mapa</span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-1 justify-end text-xs">
        <Link href={patchUrl} className={`${chipSecondary} chip-action chip-action-bottom`}>
          <span className="chip-action-label chip-action-label-bottom text-gray-400">
            Patchování
          </span>
        </Link>
        <Link href={upgradesUrl} className={`${chipSecondary} chip-action chip-action-bottom`}>
          <span className="chip-action-label chip-action-label-bottom text-gray-400">Upgrady</span>
        </Link>
        <Link href={dbUrl} className={`${chipSecondary} chip-action chip-action-bottom`}>
          <span className="chip-action-label chip-action-label-bottom text-gray-400">Stav DB</span>
        </Link>
        <Link href={hwswUrl} className={`${chipSecondary} chip-action chip-action-bottom`}>
          <span className="chip-action-label chip-action-label-bottom text-gray-400">HW/SW</span>
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
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const canonicalQ = searchTerm.trim()
  const selectedProjekt = (searchParams?.get('projekt') ?? '').toString().trim()

  const selectedProjektLabel = useMemo(() => {
    if (!selectedProjekt) return null
    const p = serviceProjects.find((sp) => (sp.doklad_proj ?? '').trim() === selectedProjekt)
    if (!p) return selectedProjekt
    const name = (p.nazev ?? '').trim()
    return name ? `${name} · ${selectedProjekt}` : selectedProjekt
  }, [selectedProjekt, serviceProjects])

  // Return context for internal navigation should reflect the *latest* filter value,
  // even if the debounced URL update hasn't flushed yet.
  const returnTo = useMemo(() => {
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    if (canonicalQ) current.set('q', canonicalQ)
    else current.delete('q')
    const qs = current.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }, [canonicalQ, pathname, searchParams])

  const onClearProjekt = useCallback(() => {
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    if (canonicalQ) current.set('q', canonicalQ)
    else current.delete('q')
    current.delete('projekt')
    const qs = current.toString()
    const href = qs ? `${pathname}?${qs}` : pathname
    router.replace(href)
  }, [canonicalQ, pathname, router, searchParams])

  // URL (`q`) is canonical for the main text filter.
  useEffect(() => {
    const q = (searchParams?.get('q') ?? '').toString()
    const isFocused = typeof document !== 'undefined' && document.activeElement === searchInputRef.current
    if (!isFocused && q !== searchTerm) {
      setSearchTerm(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!router) return

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = window.setTimeout(() => {
      const currentQ = (searchParams?.get('q') ?? '').toString()
      if (currentQ === canonicalQ) return

      const current = new URLSearchParams(searchParams?.toString() ?? '')
      if (canonicalQ) current.set('q', canonicalQ)
      else current.delete('q')

      const qs = current.toString()
      const href = qs ? `${pathname}?${qs}` : pathname
      router.replace(href)
    }, 300)

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [pathname, router, searchParams, searchTerm])

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
      <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700/60 rounded w-1/3" />
          <div className="h-12 bg-gray-700/60 rounded-lg" />
          <div className="h-64 bg-gray-700/40 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/40 border border-red-700/60 rounded-lg p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-red-200">Chyba při načítání</h3>
            <p className="text-sm text-red-300/90 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-gray-700/80 border border-gray-600/60 text-gray-100 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (serviceProjects.length === 0) {
    return (
      <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Evidence projektů</h2>
        <p className="text-sm text-gray-400">Nebyly nalezeny žádné servisní projekty.</p>
      </div>
    )
  }

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <h2 className="text-lg font-semibold text-white mb-4">Přehled projektů</h2>

      {selectedProjekt ? (
        <div className="mb-4 rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-blue-100/90">
              Projekt:{' '}
              <span className="text-blue-200/90">{selectedProjektLabel ?? selectedProjekt}</span>
            </div>
            <button
              type="button"
              onClick={onClearProjekt}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
            >
              <span className="text-blue-200/90">Zrušit projekt</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <p className="text-sm text-gray-400">
          Zobrazeno <span className="font-medium text-white">{filteredProjects.length}</span> z{' '}
          <span className="font-medium text-white">{serviceProjects.length}</span> projektů
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hledat projekt, firmu nebo doklad…"
            ref={searchInputRef}
            className="w-full sm:w-[420px] pl-4 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
          />
          {searchTerm.trim() ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2.5 rounded-lg bg-gray-700/80 border border-gray-600/60 text-gray-100 hover:bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
            >
              Vymazat
            </button>
          ) : null}
          <button
            onClick={fetchData}
            className="px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
          >
            Obnovit
          </button>
        </div>
      </div>

      <div className="evidence-projektu-registry mt-2">
        {/* Structured list header: logo column + project + actions */}
        <div className="hidden md:grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)] gap-4 px-2 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide items-center">
          <div className="w-12" aria-hidden />
          <button
            type="button"
            onClick={() => toggleSort('nazev')}
            className="inline-flex items-center gap-2 text-left hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
          >
            Projekt
            {sortKey === 'nazev' ? (sortDirection === 'asc' ? '↑' : '↓') : null}
          </button>
          <div className="text-right pr-1">Akce</div>
        </div>

        {/* Structured list body */}
        <ul className="space-y-2" role="list">
          {filteredProjects.map((project, index) => (
            <li
              key={`${project.doklad_proj || 'no-id'}-${index}`}
              className={[
                'rounded-lg border bg-gray-900/40 px-4 md:px-6 py-3.5 shadow-sm transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-500/70 hover:shadow-md hover:-translate-y-0.5',
                selectedProjekt && project.doklad_proj === selectedProjekt
                  ? 'border-blue-500/60 ring-1 ring-blue-500/30'
                  : 'border-gray-700/70',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 md:grid md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)] md:items-center md:gap-6">
                <div className="flex items-center gap-3 md:justify-center md:block">
                  <ProjectLogo
                    logo={project.logo}
                    fallbackName={project.nazev_par}
                    size="md"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <Link
                    href={{
                      pathname: `/projects/doklad-projektu/${encodeURIComponent(project.doklad_proj)}`,
                      query: { returnTo },
                    }}
                    className="link-project-name text-base font-semibold text-white hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
                  >
                    {project.nazev || '—'}
                  </Link>
                  <span className="text-sm text-gray-400">{project.nazev_par || '—'}</span>
                  <span className="text-xs text-gray-500 font-mono">{project.doklad_proj || '—'}</span>
                </div>
                <div className="flex justify-start md:justify-end">
                  <AkceProjektu project={project} returnTo={returnTo} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filteredProjects.length === 0 && searchTerm.trim() ? (
        <div className="mt-4 rounded-lg border border-gray-700/60 bg-gray-800/40 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Žádné výsledky</h3>
          <p className="text-sm text-gray-400 mb-3">
            Pro zadaný dotaz nebyly nalezeny žádné projekty.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 rounded-lg bg-gray-700/80 border border-gray-600/60 text-gray-100 hover:bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
          >
            Vymazat hledání
          </button>
        </div>
      ) : null}
    </div>
  )
}

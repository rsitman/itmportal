'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { KaratProject } from '@/lib/karat'
import { jiraIssueUrl } from '@/lib/jira'

type PrehledPatchovaniProps = {
  projects: KaratProject[]
  initialQuery?: string
}

function formatDate(dateInput: Date | null): string {
  if (!dateInput) return '—'
  if (isNaN(dateInput.getTime())) return '—'
  return dateInput.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function PrehledPatchovani({
  projects,
  initialQuery = '',
}: PrehledPatchovaniProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const canonicalQ = searchTerm.trim()

  // Return context for internal navigation should reflect the *latest* filter value,
  // even if the debounced URL update hasn't flushed yet.
  const returnTo = useMemo(() => {
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    if (canonicalQ) current.set('q', canonicalQ)
    else current.delete('q')
    const qs = current.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }, [canonicalQ, pathname, searchParams])

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
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [pathname, router, searchParams, searchTerm])

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        (p.projectName && p.projectName.toLowerCase().includes(q)) ||
        (p.companyName && p.companyName.toLowerCase().includes(q)) ||
        (p.companyId && p.companyId.toLowerCase().includes(q)) ||
        (p.projectId && p.projectId.toLowerCase().includes(q)) ||
        (p.accountManager && p.accountManager.toLowerCase().includes(q)) ||
        (p.jiraKey && p.jiraKey.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q))
    )
  }, [projects, searchTerm])

  const totalCount = projects.length
  const withPlannedPatch = useMemo(
    () => projects.filter((p) => p.nextPlannedPatchDate != null).length,
    [projects]
  )
  const needsAttention = useMemo(
    () =>
      projects.filter((p) => p.hasNewPatch || p.hasNewLegalPatch).length,
    [projects]
  )

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <HlavickaPlanuPatchovani
        totalCount={totalCount}
        withPlannedPatch={withPlannedPatch}
        needsAttention={needsAttention}
      />

      <div className="mt-4 flex flex-col gap-3">
        <FiltryPatchovani
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredProjects.length}
          totalCount={totalCount}
          inputRef={searchInputRef}
        />

        <PrehledDat
          projects={filteredProjects}
          hasAny={projects.length > 0}
          hasFilters={Boolean(searchTerm.trim())}
          returnTo={returnTo}
        />
      </div>
    </div>
  )
}

// --- Header ---
type HlavickaPlanuPatchovaniProps = {
  totalCount: number
  withPlannedPatch: number
  needsAttention: number
}

function HlavickaPlanuPatchovani({
  totalCount,
  withPlannedPatch,
  needsAttention,
}: HlavickaPlanuPatchovaniProps) {
  return (
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-2">
        <nav className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href="/evidence-projektu"
            className="group inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
              Evidence projektů
            </span>
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300">Plán patchování</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Přehled patchování
          </h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            Aktuální stav patchování, plánované termíny a indikátory stavu projektů.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 sm:flex sm:gap-6 sm:text-right shrink-0">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Projektů
            </dt>
            <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">
              {totalCount}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              S plán. patchem
            </dt>
            <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
              {withPlannedPatch}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Vyžaduje pozornost
            </dt>
            <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
              {needsAttention}
            </dd>
          </div>
        </dl>
        </div>
      </div>
    </header>
  )
}

// --- Toolbar ---
type FiltryPatchovaniProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  filteredCount: number
  totalCount: number
  inputRef?: React.RefObject<HTMLInputElement | null>
}

function FiltryPatchovani({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount,
  inputRef,
}: FiltryPatchovaniProps) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="w-full min-w-0 sm:max-w-md">
          <label
            htmlFor="patchovani-search"
            className="block text-xs font-medium text-gray-400 mb-0.5"
          >
            Hledat
          </label>
          <input
            id="patchovani-search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Hledat projekt, firmu…"
            aria-label="Hledat v přehledu patchování"
            ref={inputRef}
            className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
          />
        </div>
        <div className="text-xs text-gray-500 sm:pb-0.5 sm:text-right shrink-0">
          Zobrazeno{' '}
          <span className="font-medium text-gray-300">{filteredCount}</span> z{' '}
          <span className="font-medium text-gray-300">{totalCount}</span>
        </div>
      </div>
    </div>
  )
}

// --- Data overview: table (desktop) + stacked cards (mobile) ---
type PrehledDatProps = {
  projects: KaratProject[]
  hasAny: boolean
  hasFilters: boolean
  returnTo: string
}

const linkBase =
  'group inline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanMuted =
  'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'
const spanSecondary =
  'text-gray-400 transition-colors duration-150 group-hover:text-gray-200'

function PrehledDat({
  projects,
  hasAny,
  hasFilters,
  returnTo,
}: PrehledDatProps) {
  if (!projects.length) {
    return (
      <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
        <p className="text-base text-gray-400 leading-snug">
          {hasAny && hasFilters
            ? 'Nebyly nalezeny žádné projekty odpovídající vyhledávání.'
            : 'Žádné projekty k zobrazení.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Projekt / Firma
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">
                Plánovaný patch
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">
                Poslední instalace
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Stav
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Metadata
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-gray-500 pr-4">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/70">
            {projects.map((project, index) => (
              <tr
                key={`${project.projectId}-${project.companyId}-${index}`}
                className="transition-colors hover:bg-gray-800/50"
              >
                <RadekTabulky project={project} returnTo={returnTo} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-2">
        {projects.map((project, index) => (
          <div
            key={`${project.projectId}-${project.companyId}-${index}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 py-3"
          >
            <RadekKarty project={project} returnTo={returnTo} />
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Table row (desktop) ---
function RadekTabulky({ project, returnTo }: { project: KaratProject; returnTo: string }) {
  const detailHref = `/plan_patchovani/${project.companyId}?returnTo=${encodeURIComponent(returnTo)}`
  const patchModulesHref = `/patch-modules?projekt=${encodeURIComponent(project.projectId)}&firma=${encodeURIComponent(project.companyId)}&returnTo=${encodeURIComponent(returnTo)}`
  const jiraHref = project.jiraKey
    ? jiraIssueUrl(project.jiraKey)
    : null

  return (
    <>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-px min-w-0 leading-snug">
          <Link href={detailHref} className={linkBase}>
            <span className="text-base font-semibold text-white leading-tight transition-colors duration-150 group-hover:text-gray-200">
              {project.projectName || '—'}
            </span>
          </Link>
          <div className="text-sm text-gray-400">
            {project.companyName || '—'}
            {(project.projectId || project.companyId) && (
              <>
                <span className="text-gray-500"> · </span>
                <span className="text-xs text-gray-500 font-mono">
                  {[project.projectId, project.companyId].filter(Boolean).join(' · ')}
                </span>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-gray-200 tabular-nums whitespace-nowrap">
        {formatDate(project.nextPlannedPatchDate)}
      </td>
      <td className="px-4 py-3 align-top text-sm text-gray-200 tabular-nums whitespace-nowrap">
        {formatDate(project.lastInstalledPatchDate)}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap gap-1.5">
          <StavovyBadgePatch
            label="Patchservice"
            active={project.hasServicePatch}
            attention={false}
          />
          <StavovyBadgePatch
            label="Nový patch"
            active={!project.hasNewPatch}
            attention={project.hasNewPatch}
          />
          <StavovyBadgePatch
            label="Legislativa"
            active={!project.hasNewLegalPatch}
            attention={project.hasNewLegalPatch}
          />
        </div>
      </td>
      <td className="px-4 py-3 align-top text-xs text-gray-400 min-w-0">
        <div className="flex flex-col gap-px leading-snug">
          <div>
            {[project.version && `Verze ${project.version}`, project.country]
              .filter(Boolean)
              .join(' · ') || '—'}
          </div>
          <div className="text-gray-500 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            {project.accountManager && (
              <span>{project.accountManager}</span>
            )}
            {project.accountManager && (jiraHref || project.jiraKey) && (
              <span className="text-gray-600">·</span>
            )}
            {jiraHref ? (
              <a
                href={jiraHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkBase}
              >
                <span className={spanMuted}>{project.jiraKey}</span>
              </a>
            ) : project.jiraKey ? (
              <span>{project.jiraKey}</span>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top text-right pr-4">
        <Link
          href={patchModulesHref}
          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          <span className={spanSecondary}>Patch moduly</span>
        </Link>
      </td>
    </>
  )
}

// --- Mobile card row ---
function RadekKarty({ project, returnTo }: { project: KaratProject; returnTo: string }) {
  const detailHref = `/plan_patchovani/${project.companyId}?returnTo=${encodeURIComponent(returnTo)}`
  const patchModulesHref = `/patch-modules?projekt=${encodeURIComponent(project.projectId)}&firma=${encodeURIComponent(project.companyId)}&returnTo=${encodeURIComponent(returnTo)}`
  const jiraHref = project.jiraKey
    ? jiraIssueUrl(project.jiraKey)
    : null

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Link href={detailHref} className={linkBase}>
          <span className="text-base font-semibold text-white group-hover:text-gray-200">
            {project.projectName || '—'}
          </span>
        </Link>
        <span className="block text-sm text-gray-400">{project.companyName || '—'}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span className="text-gray-500">Plán:</span>
        <span className="text-gray-200 tabular-nums">{formatDate(project.nextPlannedPatchDate)}</span>
        <span className="text-gray-500">Posl.:</span>
        <span className="text-gray-200 tabular-nums">{formatDate(project.lastInstalledPatchDate)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StavovyBadgePatch label="Patchservice" active={project.hasServicePatch} attention={false} />
        <StavovyBadgePatch label="Nový patch" active={!project.hasNewPatch} attention={project.hasNewPatch} />
        <StavovyBadgePatch label="Legislativa" active={!project.hasNewLegalPatch} attention={project.hasNewLegalPatch} />
      </div>
      <div className="flex flex-wrap gap-2 pt-1 items-center">
        <Link
          href={patchModulesHref}
          className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50"
        >
          <span className={spanSecondary}>Patch moduly</span>
        </Link>
        {jiraHref && (
          <a href={jiraHref} target="_blank" rel="noopener noreferrer" className={linkBase}>
            <span className={spanMuted}>{project.jiraKey}</span>
          </a>
        )}
      </div>
    </div>
  )
}

// --- Status badge ---
type StavovyBadgePatchProps = {
  label: string
  active: boolean
  attention: boolean
}

function StavovyBadgePatch({
  label,
  active,
  attention,
}: StavovyBadgePatchProps) {
  if (attention) {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-700/50 bg-amber-900/30 px-2 py-0.5 text-[11px] font-medium text-amber-200/90 leading-snug">
        {label}
      </span>
    )
  }
  if (active) {
    return (
      <span className="inline-flex items-center rounded-md border border-gray-600/60 bg-gray-800/80 px-2 py-0.5 text-[11px] font-medium text-gray-200 leading-snug">
        ✓ {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/50 px-2 py-0.5 text-[11px] font-medium text-gray-500 leading-snug">
      — {label}
    </span>
  )
}

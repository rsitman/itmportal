'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { KaratProject } from '@/lib/karat'

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
        />

        <SeznamPatchovani
          projects={filteredProjects}
          hasAny={projects.length > 0}
          hasFilters={Boolean(searchTerm.trim())}
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
    </header>
  )
}

// --- Toolbar ---
type FiltryPatchovaniProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  filteredCount: number
  totalCount: number
}

function FiltryPatchovani({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount,
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

// --- List ---
type SeznamPatchovaniProps = {
  projects: KaratProject[]
  hasAny: boolean
  hasFilters: boolean
}

function SeznamPatchovani({
  projects,
  hasAny,
  hasFilters,
}: SeznamPatchovaniProps) {
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
      <div className="hidden lg:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] gap-3 px-1 pb-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
        <div>Projekt a firma</div>
        <div>Termíny a stav</div>
        <div>Metadata</div>
        <div className="text-right pr-0.5">Akce</div>
      </div>
      <ul className="space-y-2 mt-0.5" role="list">
        {projects.map((project, index) => (
          <li
            key={`${project.projectId}-${project.companyId}-${index}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 md:px-5 py-3 shadow-sm transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-500/70 hover:shadow-md hover:-translate-y-0.5"
          >
            <RadekPatchovani project={project} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- Row ---
type RadekPatchovaniProps = {
  project: KaratProject
}

const linkBase =
  'group inline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanMuted =
  'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'
const spanSecondary =
  'text-gray-400 transition-colors duration-150 group-hover:text-gray-200'

function RadekPatchovani({ project }: RadekPatchovaniProps) {
  const detailHref = `/plan_patchovani/${project.companyId}`
  const patchModulesHref = `/patch-modules?projekt=${encodeURIComponent(project.projectId)}&firma=${encodeURIComponent(project.companyId)}`
  const jiraHref = project.jiraKey
    ? `https://itmancz.atlassian.net/browse/${project.jiraKey}`
    : null

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-4">
      {/* Blok 1 – Identita */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <Link href={detailHref} className={linkBase}>
          <span className="font-semibold text-white leading-tight transition-colors duration-150 group-hover:text-gray-200">
            {project.projectName || '—'}
          </span>
        </Link>
        <span className="text-sm text-gray-400 leading-snug">
          {project.companyName || '—'}
        </span>
        <div className="text-[11px] text-gray-500 font-mono leading-tight mt-0.5">
          {project.projectId || '—'} · {project.companyId || '—'}
        </div>
      </div>

      {/* Blok 2 – Termíny a stav */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
          <span className="text-gray-400">
            Plán: <span className="text-gray-200 tabular-nums">{formatDate(project.nextPlannedPatchDate)}</span>
          </span>
          <span className="text-gray-400">
            Posl.: <span className="text-gray-200 tabular-nums">{formatDate(project.lastInstalledPatchDate)}</span>
          </span>
        </div>
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
      </div>

      {/* Blok 3 – Metadata */}
      <div className="flex flex-col gap-0.5 text-sm min-w-0">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {project.version && (
            <span className="text-gray-400">Verze {project.version}</span>
          )}
          {project.country && (
            <span className="text-gray-500">{project.country}</span>
          )}
        </div>
        {project.accountManager && (
          <span className="text-gray-500 text-xs leading-snug">
            {project.accountManager}
          </span>
        )}
        {jiraHref ? (
          <a
            href={jiraHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkBase} inline-flex items-baseline gap-1`}
          >
            <span className={spanMuted}>{project.jiraKey}</span>
          </a>
        ) : project.jiraKey ? (
          <span className="text-gray-500 text-xs">{project.jiraKey}</span>
        ) : null}
      </div>

      {/* Blok 4 – Akce */}
      <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
        <Link
          href={patchModulesHref}
          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          <span className={spanSecondary}>Patch moduly</span>
        </Link>
        <Link
          href={detailHref}
          className="inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium rounded-md border border-gray-600/40 bg-gray-800/40 hover:bg-gray-700/50 hover:border-gray-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
        >
          <span className={spanSecondary}>Detail</span>
        </Link>
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

'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { ChevronRight, CodeXml, SquareCheckBig } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SmallProject } from '@/types/project'
import { logger } from '@/lib/logger'
import { jiraIssueUrl } from '@/lib/jira'
import { useServiceProjects } from '@/lib/useServiceProjects'

const linkBase =
  'group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanLinkMuted =
  'text-gray-400 transition-colors duration-150 group-hover:text-gray-200'
const jiraKeyBadgeClass =
  'inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/40 px-2.5 py-1.5 text-sm font-medium font-mono leading-tight'
const jiraKeyFallbackClass = 'font-mono text-sm text-gray-500'
const filterInputClass =
  'w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50'
const filterSelectClass =
  'w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50'
const filterLabelClass = 'block text-xs font-medium text-gray-400 mb-0.5'

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeLabel(value)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'cs'),
  )
}

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? '').toString().replace(/\s+/g, ' ').trim()
}

function normalizeProjektId(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toUpperCase()
}

function normalizePersonKey(value: string | null | undefined): string {
  return normalizeLabel(value).toLowerCase()
}

function collectPersonOptions(
  projects: SmallProject[],
  pick: (project: SmallProject) => string,
  pickSub: (subTask: SmallProject['sub_tasks'][number]) => string,
): string[] {
  const byKey = new Map<string, string>()
  for (const project of projects) {
    for (const raw of [pick(project), ...project.sub_tasks.map(pickSub)]) {
      const label = normalizeLabel(raw)
      if (!label) continue
      const key = normalizePersonKey(label)
      if (!key) continue
      if (!byKey.has(key)) byKey.set(key, label)
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'cs'))
}

type RowFilters = {
  resitel: string
  zadavatel: string
  stav: string
}

function getJiraHref(issueKey: string | null | undefined): string | null {
  const key = (issueKey ?? '').toString().trim()
  if (!key) return null
  return jiraIssueUrl(key)
}

function JiraKeyCell({
  issueKey,
  onClick,
}: {
  issueKey: string
  onClick?: (event: MouseEvent) => void
}) {
  const href = getJiraHref(issueKey)

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${linkBase} -ml-1`}
        onClick={onClick}
      >
        <span className={jiraKeyBadgeClass}>
          <span className={spanLinkMuted}>{issueKey}</span>
        </span>
      </a>
    )
  }

  return <span className={jiraKeyFallbackClass}>{issueKey || '—'}</span>
}

function formatHours(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value % 1 === 0 ? String(value) : value.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })
}

/** L-tvar z corner-down-right bez šipky na konci */
function SubTaskBranchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 4v7a4 4 0 0 0 4 4h12" />
    </svg>
  )
}

function MainTaskTypeIcon() {
  return (
    <SquareCheckBig
      className="h-4 w-4 text-emerald-400/90 shrink-0"
      aria-hidden
    />
  )
}

function SubTaskTypeIcons() {
  return (
    <div className="flex items-center text-gray-500" aria-hidden>
      <SubTaskBranchIcon className="h-4 w-4 shrink-0" />
      <CodeXml className="h-5 w-5 shrink-0 ml-1.5 text-emerald-400/90" />
    </div>
  )
}

interface SmallProjectsClientProps {
  endpoint: string
  title: string
  description: string
  emptyMessage: string
  showProjectColumn?: boolean
  showPartnerColumn?: boolean
  initialQuery?: string
  initialProjekt?: string
  initialResitel?: string
  initialZadavatel?: string
  initialStav?: string
}

export default function SmallProjectsClient({
  endpoint,
  title,
  description,
  emptyMessage,
  showProjectColumn = true,
  showPartnerColumn = false,
  initialQuery = '',
  initialProjekt = '',
  initialResitel = '',
  initialZadavatel = '',
  initialStav = '',
}: SmallProjectsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { labelByDoklad, projects: serviceProjects } = useServiceProjects()
  const searchDebounceRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<SmallProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [selectedProjekt, setSelectedProjekt] = useState(initialProjekt)
  const [selectedResitel, setSelectedResitel] = useState(initialResitel)
  const [selectedZadavatel, setSelectedZadavatel] = useState(initialZadavatel)
  const [selectedStav, setSelectedStav] = useState(initialStav)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const canonicalQ = searchTerm.trim()
  const canonicalProjekt = normalizeProjektId(selectedProjekt)
  const canonicalResitel = normalizeLabel(selectedResitel)
  const canonicalZadavatel = normalizeLabel(selectedZadavatel)
  const canonicalStav = normalizeLabel(selectedStav)

  const fetchProjects = useCallback(async () => {
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
        setError(errorBody?.message || 'Nepodařilo se načíst evidenci malých projektů.')
        return
      }

      const data = await response.json()
      setProjects(Array.isArray(data) ? data : data.projects || [])
    } catch (fetchError) {
      logger.error('Error fetching small projects:', fetchError)
      setError('Došlo k chybě při načítání evidence malých projektů.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    const q = (searchParams?.get('q') ?? '').toString()
    const isFocused = typeof document !== 'undefined' && document.activeElement === searchInputRef.current
    if (!isFocused && q !== searchTerm) {
      setSearchTerm(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const p = (searchParams?.get('projekt') ?? '').toString()
    const normalized = normalizeProjektId(p)
    if (normalized !== normalizeProjektId(selectedProjekt)) setSelectedProjekt(normalized)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const value = normalizeLabel(searchParams?.get('resitel'))
    if (value !== canonicalResitel) setSelectedResitel(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const value = normalizeLabel(searchParams?.get('zadavatel'))
    if (value !== canonicalZadavatel) setSelectedZadavatel(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const value = normalizeLabel(searchParams?.get('stav'))
    if (value !== canonicalStav) setSelectedStav(value)
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
  }, [canonicalQ, pathname, router, searchParams])

  const replaceFilterUrl = useCallback(
    (patch: {
      q?: string
      projekt?: string
      resitel?: string
      zadavatel?: string
      stav?: string
    }) => {
      const current = new URLSearchParams(searchParams?.toString() ?? '')
      const nextQ = patch.q !== undefined ? patch.q : canonicalQ
      const nextProjekt = patch.projekt !== undefined ? patch.projekt : canonicalProjekt
      const nextResitel = patch.resitel !== undefined ? patch.resitel : canonicalResitel
      const nextZadavatel = patch.zadavatel !== undefined ? patch.zadavatel : canonicalZadavatel
      const nextStav = patch.stav !== undefined ? patch.stav : canonicalStav

      if (nextQ) current.set('q', nextQ)
      else current.delete('q')
      if (nextProjekt) current.set('projekt', nextProjekt)
      else current.delete('projekt')
      if (nextResitel) current.set('resitel', nextResitel)
      else current.delete('resitel')
      if (nextZadavatel) current.set('zadavatel', nextZadavatel)
      else current.delete('zadavatel')
      if (nextStav) current.set('stav', nextStav)
      else current.delete('stav')

      const qs = current.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [
      canonicalProjekt,
      canonicalQ,
      canonicalResitel,
      canonicalStav,
      canonicalZadavatel,
      pathname,
      router,
      searchParams,
    ],
  )

  const onProjektChange = (value: string) => {
    const normalized = normalizeProjektId(value)
    setSelectedProjekt(normalized)
    replaceFilterUrl({ projekt: normalized })
  }

  const onClearProjekt = () => onProjektChange('')

  const onResitelChange = (value: string) => {
    const label = normalizeLabel(value)
    setSelectedResitel(label)
    replaceFilterUrl({ resitel: label })
  }

  const onClearResitel = () => onResitelChange('')

  const onZadavatelChange = (value: string) => {
    const label = normalizeLabel(value)
    setSelectedZadavatel(label)
    replaceFilterUrl({ zadavatel: label })
  }

  const onClearZadavatel = () => onZadavatelChange('')

  const onStavChange = (value: string) => {
    const label = normalizeLabel(value)
    setSelectedStav(label)
    replaceFilterUrl({ stav: label })
  }

  const projectOptions = useMemo(() => {
    const available = new Set(
      projects.map((project) => normalizeProjektId(project.projekt)).filter(Boolean),
    )
    const options = serviceProjects
      .filter((project) => available.has(normalizeProjektId(project.doklad_proj)))
      .map((project) => {
        const value = normalizeProjektId(project.doklad_proj)
        return {
          value,
          label: labelByDoklad.get((project.doklad_proj ?? '').trim()) ?? value,
        }
      })
      .filter((project) => project.value)
      .sort((first, second) => first.label.localeCompare(second.label, 'cs'))

    if (canonicalProjekt && !options.some((option) => option.value === canonicalProjekt)) {
      return [
        {
          value: canonicalProjekt,
          label: labelByDoklad.get(canonicalProjekt) ?? canonicalProjekt,
        },
        ...options,
      ]
    }

    return options
  }, [canonicalProjekt, labelByDoklad, projects, serviceProjects])

  const selectedProjektLabel = useMemo(() => {
    if (!canonicalProjekt) return null
    return labelByDoklad.get(canonicalProjekt) ?? null
  }, [canonicalProjekt, labelByDoklad])

  const nazevParByDoklad = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of serviceProjects) {
      const doklad = (p.doklad_proj ?? '').trim()
      if (!doklad) continue
      map.set(doklad, (p.nazev_par ?? '').trim())
    }
    return map
  }, [serviceProjects])

  const resiteleOptions = useMemo(() => {
    const base = collectPersonOptions(
      projects,
      (project) => project.resitel,
      (subTask) => subTask.resitel,
    )
    if (canonicalResitel && !base.some((item) => normalizePersonKey(item) === normalizePersonKey(canonicalResitel))) {
      return [canonicalResitel, ...base]
    }
    return base
  }, [canonicalResitel, projects])

  const zadavateleOptions = useMemo(() => {
    const base = collectPersonOptions(
      projects,
      (project) => project.zadavatel,
      (subTask) => subTask.zadavatel,
    )
    if (
      canonicalZadavatel &&
      !base.some((item) => normalizePersonKey(item) === normalizePersonKey(canonicalZadavatel))
    ) {
      return [canonicalZadavatel, ...base]
    }
    return base
  }, [canonicalZadavatel, projects])

  const stavyOptions = useMemo(() => {
    const base = uniqueSorted([
      ...projects.map((project) => project.stav),
      ...projects.flatMap((project) => project.sub_tasks.map((subTask) => subTask.stav)),
    ])
    if (canonicalStav && !base.includes(canonicalStav)) {
      return [canonicalStav, ...base]
    }
    return base
  }, [canonicalStav, projects])

  const resitelFromUrlUnknown = useMemo(() => {
    if (!canonicalResitel) return false
    return !projects.some(
      (project) =>
        normalizePersonKey(project.resitel) === normalizePersonKey(canonicalResitel) ||
        project.sub_tasks.some(
          (subTask) => normalizePersonKey(subTask.resitel) === normalizePersonKey(canonicalResitel),
        ),
    )
  }, [canonicalResitel, projects])

  const zadavatelFromUrlUnknown = useMemo(() => {
    if (!canonicalZadavatel) return false
    return !projects.some(
      (project) =>
        normalizePersonKey(project.zadavatel) === normalizePersonKey(canonicalZadavatel) ||
        project.sub_tasks.some(
          (subTask) => normalizePersonKey(subTask.zadavatel) === normalizePersonKey(canonicalZadavatel),
        ),
    )
  }, [canonicalZadavatel, projects])

  const matchesDropdownFilters = useCallback(
    (row: RowFilters) => {
      if (canonicalResitel && normalizeLabel(row.resitel) !== canonicalResitel) return false
      if (canonicalZadavatel && normalizeLabel(row.zadavatel) !== canonicalZadavatel) return false
      if (canonicalStav && normalizeLabel(row.stav) !== canonicalStav) return false
      return true
    },
    [canonicalResitel, canonicalStav, canonicalZadavatel],
  )

  const matchesProjectSearch = useCallback(
    (project: SmallProject, normalizedSearch: string) => {
      const partnerName = (nazevParByDoklad.get(project.projekt.trim()) ?? '').toLowerCase()

      return (
        project.projekt.toLowerCase().includes(normalizedSearch) ||
        project.nazev_proj.toLowerCase().includes(normalizedSearch) ||
        project.jira_klic.toLowerCase().includes(normalizedSearch) ||
        project.nazev_poz.toLowerCase().includes(normalizedSearch) ||
        (showPartnerColumn && partnerName.includes(normalizedSearch)) ||
        project.resitel.toLowerCase().includes(normalizedSearch) ||
        project.zadavatel.toLowerCase().includes(normalizedSearch) ||
        project.stav.toLowerCase().includes(normalizedSearch)
      )
    },
    [nazevParByDoklad, showPartnerColumn],
  )

  const matchesSubTaskSearch = useCallback((subTask: SmallProject['sub_tasks'][number], normalizedSearch: string) => {
    return (
      subTask.jira_klic_sub.toLowerCase().includes(normalizedSearch) ||
      subTask.nazev_sub.toLowerCase().includes(normalizedSearch) ||
      subTask.resitel.toLowerCase().includes(normalizedSearch) ||
      subTask.zadavatel.toLowerCase().includes(normalizedSearch) ||
      subTask.stav.toLowerCase().includes(normalizedSearch)
    )
  }, [])

  const filteredProjects = useMemo(() => {
    const normalizedSearch = canonicalQ.toLowerCase()

    return projects
      .filter(
        (project) => !canonicalProjekt || normalizeProjektId(project.projekt) === canonicalProjekt,
      )
      .map((project) => {
        const subsMatchingDropdowns = project.sub_tasks.filter((subTask) => matchesDropdownFilters(subTask))
        const mainMatchesDropdowns = matchesDropdownFilters(project)

        let visibleSubTasks = subsMatchingDropdowns
        if (normalizedSearch) {
          visibleSubTasks = visibleSubTasks.filter((subTask) => matchesSubTaskSearch(subTask, normalizedSearch))
        }

        const mainMatchesSearch = !normalizedSearch || matchesProjectSearch(project, normalizedSearch)
        const mainMatches = mainMatchesDropdowns && mainMatchesSearch
        const include = mainMatches || visibleSubTasks.length > 0

        if (!include) return null

        return {
          ...project,
          visibleSubTasks,
        }
      })
      .filter((project): project is SmallProject & { visibleSubTasks: SmallProject['sub_tasks'] } => project !== null)
      .sort((first, second) => {
        const projectCompare = first.projekt.localeCompare(second.projekt, 'cs')
        if (projectCompare !== 0) return projectCompare
        return first.nazev_poz.localeCompare(second.nazev_poz, 'cs')
      })
  }, [
    matchesDropdownFilters,
    matchesProjectSearch,
    matchesSubTaskSearch,
    projects,
    canonicalProjekt,
    canonicalQ,
  ])

  const hasActiveFilters = Boolean(
    canonicalQ || canonicalProjekt || canonicalResitel || canonicalZadavatel || canonicalStav,
  )

  const totalSubTasks = filteredProjects.reduce((sum, project) => sum + project.visibleSubTasks.length, 0)
  const totalBudget = filteredProjects.reduce((sum, project) => sum + project.rozp, 0)
  const totalHours = filteredProjects.reduce((sum, project) => sum + project.hodin_odv, 0)

  const toggleRow = (rowKey: string) => {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(rowKey)) {
        next.delete(rowKey)
      } else {
        next.add(rowKey)
      }
      return next
    })
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
          onClick={fetchProjects}
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
          <div className="text-2xl font-bold text-white">{filteredProjects.length}</div>
          <div className="text-sm text-gray-400">Celkem požadavků</div>
        </div>
        <div className="card-professional p-4">
          <div className="text-2xl font-bold text-green-400">{totalSubTasks}</div>
          <div className="text-sm text-gray-400">Podúkoly</div>
        </div>
        <div className="card-professional p-4">
          <div className="text-2xl font-bold text-blue-400">
            {formatHours(totalHours)} / {formatHours(totalBudget)} h
          </div>
          <div className="text-sm text-gray-400">Odvedeno / rozpočet</div>
        </div>
      </div>

      <div className="mb-6">
        <FiltryMaleProjektu
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedProjekt={canonicalProjekt}
          selectedProjektLabel={selectedProjektLabel}
          onProjektChange={onProjektChange}
          onClearProjekt={onClearProjekt}
          projectOptions={projectOptions}
          showProjectColumn={showProjectColumn}
          selectedResitel={canonicalResitel}
          onResitelChange={onResitelChange}
          onClearResitel={onClearResitel}
          resiteleOptions={resiteleOptions}
          resitelFromUrlUnknown={resitelFromUrlUnknown}
          selectedZadavatel={canonicalZadavatel}
          onZadavatelChange={onZadavatelChange}
          onClearZadavatel={onClearZadavatel}
          zadavateleOptions={zadavateleOptions}
          zadavatelFromUrlUnknown={zadavatelFromUrlUnknown}
          selectedStav={canonicalStav}
          onStavChange={onStavChange}
          stavyOptions={stavyOptions}
          filteredCount={filteredProjects.length}
          totalCount={projects.length}
          inputRef={searchInputRef}
        />
      </div>

      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-8" />
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20"
                  aria-label="Typ položky"
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jira
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Název požadavku
                </th>
                {showPartnerColumn ? (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Projekt
                  </th>
                ) : null}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Rozpočet
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Odvedeno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Řešitel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Zadavatel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Stav
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredProjects.map((project, index) => {
                const rowKey = `${project.projekt}-${project.jira_klic}-${index}`
                const isExpanded = expandedRows.has(rowKey)
                const hasSubTasks = project.visibleSubTasks.length > 0
                const partnerName = nazevParByDoklad.get(project.projekt.trim()) || '—'

                return (
                  <Fragment key={rowKey}>
                    <tr
                      className={`${
                        isExpanded ? 'bg-gray-800/25' : ''
                      } hover:bg-gray-800/60 ${hasSubTasks ? 'cursor-pointer' : ''}`}
                      onClick={hasSubTasks ? () => toggleRow(rowKey) : undefined}
                    >
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {hasSubTasks ? (
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        ) : null}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <MainTaskTypeIcon />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <JiraKeyCell
                          issueKey={project.jira_klic}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">{project.nazev_poz}</td>
                      {showPartnerColumn ? (
                        <td className="px-6 py-4 text-sm text-gray-400">{partnerName}</td>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">
                        {formatHours(project.rozp)} h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">
                        {formatHours(project.hodin_odv)} h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">{project.resitel || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-200">{project.zadavatel || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-200">{project.stav || '—'}</td>
                    </tr>

                    {isExpanded &&
                      project.visibleSubTasks.map((subTask, subIndex) => {
                        return (
                          <tr
                            key={`${rowKey}-sub-${subIndex}`}
                            className="bg-gray-900/40 hover:bg-gray-900/70"
                          >
                            <td className="px-4 py-3" />
                            <td className="px-3 py-3 whitespace-nowrap">
                              <SubTaskTypeIcons />
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                              <JiraKeyCell issueKey={subTask.jira_klic_sub} />
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-300">
                              {subTask.nazev_sub}
                            </td>
                            {showPartnerColumn ? (
                              <td className="px-6 py-3 text-sm text-gray-500">{partnerName}</td>
                            ) : null}
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                              {formatHours(subTask.vyr_rozp)} h
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                              {formatHours(subTask.hodin_odv)} h
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-300">{subTask.resitel || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-300">{subTask.zadavatel || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-300">{subTask.stav || '—'}</td>
                          </tr>
                        )
                      })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {hasActiveFilters
            ? 'Nebyly nalezeny žádné záznamy odpovídající filtrům.'
            : emptyMessage}
        </div>
      )}
    </div>
  )
}

type FiltryMaleProjektuProps = {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedProjekt: string
  selectedProjektLabel: string | null
  onProjektChange: (value: string) => void
  onClearProjekt: () => void
  projectOptions: { value: string; label: string }[]
  showProjectColumn: boolean
  selectedResitel: string
  onResitelChange: (value: string) => void
  onClearResitel: () => void
  resiteleOptions: string[]
  resitelFromUrlUnknown?: boolean
  selectedZadavatel: string
  onZadavatelChange: (value: string) => void
  onClearZadavatel: () => void
  zadavateleOptions: string[]
  zadavatelFromUrlUnknown?: boolean
  selectedStav: string
  onStavChange: (value: string) => void
  stavyOptions: string[]
  filteredCount: number
  totalCount: number
  inputRef?: RefObject<HTMLInputElement>
}

function FiltryMaleProjektu({
  searchTerm,
  onSearchChange,
  selectedProjekt,
  selectedProjektLabel,
  onProjektChange,
  onClearProjekt,
  projectOptions,
  showProjectColumn,
  selectedResitel,
  onResitelChange,
  onClearResitel,
  resiteleOptions,
  resitelFromUrlUnknown = false,
  selectedZadavatel,
  onZadavatelChange,
  onClearZadavatel,
  zadavateleOptions,
  zadavatelFromUrlUnknown = false,
  selectedStav,
  onStavChange,
  stavyOptions,
  filteredCount,
  totalCount,
  inputRef,
}: FiltryMaleProjektuProps) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-2.5">
        {showProjectColumn && selectedProjekt ? (
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-100/90">
                Projekt:{' '}
                <span className="text-blue-200/90">{selectedProjektLabel ?? selectedProjekt}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedResitel ? (
                  <button
                    type="button"
                    onClick={onClearResitel}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
                  >
                    <span className="text-blue-200/90">Zrušit řešitele</span>
                  </button>
                ) : null}
                {selectedZadavatel ? (
                  <button
                    type="button"
                    onClick={onClearZadavatel}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
                  >
                    <span className="text-blue-200/90">Zrušit zadavatele</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClearProjekt}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
                >
                  <span className="text-blue-200/90">Zrušit projekt</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedResitel && !(showProjectColumn && selectedProjekt) ? (
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-100/90">
                Řešitel: <span className="text-blue-200/90">{selectedResitel}</span>
              </div>
              <button
                type="button"
                onClick={onClearResitel}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
              >
                <span className="text-blue-200/90">Zrušit řešitele</span>
              </button>
            </div>
          </div>
        ) : null}

        {selectedZadavatel && !(showProjectColumn && selectedProjekt) && !selectedResitel ? (
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-100/90">
                Zadavatel: <span className="text-blue-200/90">{selectedZadavatel}</span>
              </div>
              <button
                type="button"
                onClick={onClearZadavatel}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
              >
                <span className="text-blue-200/90">Zrušit zadavatele</span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 w-full min-w-0">
            <div className="w-full min-w-0 sm:max-w-md">
              <label htmlFor="male-projekty-search" className={filterLabelClass}>
                Hledat
              </label>
              <input
                id="male-projekty-search"
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Hledat projekt, Jira, název…"
                aria-label="Hledat v evidenci malých projektů"
                ref={inputRef}
                className={filterInputClass}
              />
            </div>

            {showProjectColumn ? (
              <div className="w-full sm:w-80">
                <label htmlFor="male-projekty-projekt" className={filterLabelClass}>
                  Projekt
                </label>
                <select
                  id="male-projekty-projekt"
                  value={selectedProjekt}
                  onChange={(event) => onProjektChange(event.target.value)}
                  aria-label="Projektový kontext"
                  className={filterSelectClass}
                >
                  <option value="">Všechny projekty</option>
                  {projectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="w-full sm:w-72">
              <label htmlFor="male-projekty-resitel" className={filterLabelClass}>
                Řešitel
              </label>
              <select
                id="male-projekty-resitel"
                value={selectedResitel}
                onChange={(event) => onResitelChange(event.target.value)}
                aria-label="Filtr podle řešitele"
                className={filterSelectClass}
              >
                <option value="">Všichni řešitelé</option>
                {resiteleOptions.map((resitel, index) => {
                  const isUnknown =
                    Boolean(resitelFromUrlUnknown) &&
                    index === 0 &&
                    normalizePersonKey(resitel) === normalizePersonKey(selectedResitel)
                  const label = isUnknown ? `${resitel} (mimo aktuální data)` : resitel
                  return (
                    <option key={`${resitel}-${index}`} value={resitel}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="w-full sm:w-72">
              <label htmlFor="male-projekty-zadavatel" className={filterLabelClass}>
                Zadavatel
              </label>
              <select
                id="male-projekty-zadavatel"
                value={selectedZadavatel}
                onChange={(event) => onZadavatelChange(event.target.value)}
                aria-label="Filtr podle zadavatele"
                className={filterSelectClass}
              >
                <option value="">Všichni zadavatelé</option>
                {zadavateleOptions.map((zadavatel, index) => {
                  const isUnknown =
                    Boolean(zadavatelFromUrlUnknown) &&
                    index === 0 &&
                    normalizePersonKey(zadavatel) === normalizePersonKey(selectedZadavatel)
                  const label = isUnknown ? `${zadavatel} (mimo aktuální data)` : zadavatel
                  return (
                    <option key={`${zadavatel}-${index}`} value={zadavatel}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="w-full sm:w-56">
              <label htmlFor="male-projekty-stav" className={filterLabelClass}>
                Stav
              </label>
              <select
                id="male-projekty-stav"
                value={selectedStav}
                onChange={(event) => onStavChange(event.target.value)}
                aria-label="Filtr podle stavu"
                className={filterSelectClass}
              >
                <option value="">Všechny stavy</option>
                {stavyOptions.map((stav) => (
                  <option key={stav} value={stav}>
                    {stav}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Zobrazeno <span className="font-medium text-gray-300">{filteredCount}</span> z{' '}
            <span className="font-medium text-gray-300">{totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

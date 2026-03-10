'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalComponent } from '@/types/project'
import { logger } from '@/lib/logger'

type ExterniKomponentyPageProps = {
  dokladProjektu: string
}

export default function ExterniKomponentyPage({ dokladProjektu }: ExterniKomponentyPageProps) {
  const [components, setComponents] = useState<ExternalComponent[]>([])
  const [projectName, setProjectName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSupplier, setFilterSupplier] = useState<string>('')
  const [filterForm, setFilterForm] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [extcompsRes, serviceProjectsRes] = await Promise.all([
          fetch(`/api/projects/${encodeURIComponent(dokladProjektu)}/extcomps`),
          fetch('/api/service-projects'),
        ])

        if (!extcompsRes.ok) {
          const message = `Nepodařilo se načíst externí komponenty (HTTP ${extcompsRes.status})`
          logger.error('Error fetching external components:', message)
          if (isMounted) setError(message)
          return
        }

        const data = await extcompsRes.json()
        const list: ExternalComponent[] = Array.isArray(data.components) ? data.components : []
        if (isMounted) setComponents(list)

        if (serviceProjectsRes.ok && isMounted) {
          const projects = await serviceProjectsRes.json()
          const project = Array.isArray(projects)
            ? projects.find((p: { doklad_proj?: string }) => p.doklad_proj === dokladProjektu)
            : null
          if (project?.nazev) setProjectName(project.nazev)
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Došlo k chybě při načítání externích komponent'
        logger.error('Error fetching external components:', e)
        if (isMounted) setError(message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [dokladProjektu])

  const filteredComponents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return components.filter((c) => {
      const matchesSearch =
        !q ||
        (c.nazev && c.nazev.toLowerCase().includes(q)) ||
        (c.kod && c.kod.toLowerCase().includes(q)) ||
        (c.dodavatel && c.dodavatel.toLowerCase().includes(q)) ||
        (c.popis && c.popis.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      const matchesSupplier = !filterSupplier || c.dodavatel === filterSupplier
      const matchesForm = !filterForm || c.forma_kom === filterForm
      return matchesSearch && matchesSupplier && matchesForm
    })
  }, [components, searchTerm, filterSupplier, filterForm])

  const uniqueSuppliers = useMemo(
    () => [...new Set(components.map((c) => c.dodavatel).filter(Boolean))].sort(),
    [components]
  )
  const uniqueForms = useMemo(
    () => [...new Set(components.map((c) => c.forma_kom).filter(Boolean))].sort(),
    [components]
  )

  const exportToCsv = () => {
    const headers = [
      'Kód',
      'Název',
      'Popis',
      'Forma',
      'Dodavatel',
      'Jméno',
      'Příjmení',
      'Email',
      'Telefon',
    ]
    const rows = filteredComponents.map((c) => [
      c.kod,
      c.nazev,
      (c.popis || '').replace(/\n/g, ' '),
      c.forma_kom,
      c.dodavatel,
      c.jmeno,
      c.prijmeni,
      c.email || '',
      c.telefon || '',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `externi-komponenty-${dokladProjektu}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const totalCount = components.length
  const supplierCount = uniqueSuppliers.length
  const formCount = uniqueForms.length
  const showSkeleton = loading && components.length === 0
  const hasFilters = Boolean(searchTerm.trim() || filterSupplier || filterForm)

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-6 space-y-6">
        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
          <HlavickaExternichKomponent
            dokladProjektu={dokladProjektu}
            projectName={projectName}
            totalCount={totalCount}
            supplierCount={supplierCount}
            formCount={formCount}
          />

          <div className="mt-4 flex flex-col gap-3">
            <FiltryExternichKomponent
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterSupplier={filterSupplier}
              onFilterSupplierChange={setFilterSupplier}
              filterForm={filterForm}
              onFilterFormChange={setFilterForm}
              uniqueSuppliers={uniqueSuppliers}
              uniqueForms={uniqueForms}
              filteredCount={filteredComponents.length}
              totalCount={totalCount}
              onExport={exportToCsv}
            />

            {error && (
              <div className="rounded-lg border border-red-700/70 bg-red-900/40 px-5 py-4 text-base text-red-100">
                <div className="font-semibold mb-1">Chyba při načítání externích komponent</div>
                <div className="text-red-100/90 leading-snug">{error}</div>
              </div>
            )}

            <SeznamExternichKomponent
              loading={showSkeleton}
              components={filteredComponents}
              hasAny={components.length > 0}
              hasFilters={hasFilters}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Header ---
type HlavickaExternichKomponentProps = {
  dokladProjektu: string
  projectName: string | null
  totalCount: number
  supplierCount: number
  formCount: number
}

function HlavickaExternichKomponent({
  dokladProjektu,
  projectName,
  totalCount,
  supplierCount,
  formCount,
}: HlavickaExternichKomponentProps) {
  return (
    <header className="border-b border-gray-700/50 pb-4 mb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Externí komponenty projektu
          </h1>
          {projectName ? (
            <p className="mt-1 text-sm font-medium text-gray-200 leading-snug">
              {projectName}
              <span className="ml-1.5 text-[11px] font-normal text-gray-500 font-mono">
                · {dokladProjektu}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-200 leading-snug">
              <span className="text-[11px] text-gray-500 font-mono">{dokladProjektu}</span>
            </p>
          )}
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            Seznam externích softwarových komponent třetích stran a kontaktů.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-0.5 sm:flex sm:gap-8 sm:text-right shrink-0">
          <div className="sm:min-w-[4.5rem]">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Celkem
            </dt>
            <dd className="text-base font-semibold text-white mt-0.5 tabular-nums">{totalCount}</dd>
          </div>
          <div className="sm:min-w-[4.5rem]">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Dodavatelé
            </dt>
            <dd className="text-base font-semibold text-gray-200 mt-0.5 tabular-nums">
              {supplierCount}
            </dd>
          </div>
          <div className="sm:min-w-[4.5rem]">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Formy
            </dt>
            <dd className="text-base font-semibold text-gray-200 mt-0.5 tabular-nums">
              {formCount}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

// --- Toolbar / Filters ---
type FiltryExternichKomponentProps = {
  searchTerm: string
  onSearchChange: (v: string) => void
  filterSupplier: string
  onFilterSupplierChange: (v: string) => void
  filterForm: string
  onFilterFormChange: (v: string) => void
  uniqueSuppliers: string[]
  uniqueForms: string[]
  filteredCount: number
  totalCount: number
  onExport: () => void
}

function FiltryExternichKomponent({
  searchTerm,
  onSearchChange,
  filterSupplier,
  onFilterSupplierChange,
  filterForm,
  onFilterFormChange,
  uniqueSuppliers,
  uniqueForms,
  filteredCount,
  totalCount,
  onExport,
}: FiltryExternichKomponentProps) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="w-full min-w-0 sm:max-w-md">
            <label
              htmlFor="extcomps-search"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Hledat komponentu
            </label>
            <input
              id="extcomps-search"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Kód, název, dodavatel, popis…"
              aria-label="Hledat v komponentách"
              className="w-full pl-3 pr-3 py-2 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            />
          </div>
          <div className="text-xs text-gray-500 sm:pb-0.5 sm:text-right shrink-0">
            Zobrazeno <span className="font-medium text-gray-300">{filteredCount}</span> z{' '}
            <span className="font-medium text-gray-300">{totalCount}</span> komponent
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div className="w-full min-w-0 sm:w-44">
            <label
              htmlFor="extcomps-supplier"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Dodavatel
            </label>
            <select
              id="extcomps-supplier"
              value={filterSupplier}
              onChange={(e) => onFilterSupplierChange(e.target.value)}
              aria-label="Filtr podle dodavatele"
              className="w-full pl-3 pr-3 py-2 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <option value="">Všichni dodavatelé</option>
              {uniqueSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0 sm:w-44">
            <label
              htmlFor="extcomps-form"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Forma
            </label>
            <select
              id="extcomps-form"
              value={filterForm}
              onChange={(e) => onFilterFormChange(e.target.value)}
              aria-label="Filtr podle formy komponenty"
              className="w-full pl-3 pr-3 py-2 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <option value="">Všechny formy</option>
              {uniqueForms.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/50 text-gray-400 text-xs font-medium hover:bg-gray-700/60 hover:text-gray-300 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors shrink-0"
          >
            Export do CSV
          </button>
        </div>
      </div>
    </div>
  )
}

// --- List ---
type SeznamExternichKomponentProps = {
  loading: boolean
  components: ExternalComponent[]
  hasAny: boolean
  hasFilters: boolean
}

function SeznamExternichKomponent({
  loading,
  components,
  hasAny,
  hasFilters,
}: SeznamExternichKomponentProps) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] rounded-lg bg-gray-800/60 border border-gray-700/60 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!components.length) {
    return (
      <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
        <p className="text-base text-gray-400 leading-snug">
          {hasAny && hasFilters
            ? 'Nebyly nalezeny žádné komponenty odpovídající filtrům.'
            : 'Tento projekt nemá žádné externí komponenty.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="hidden lg:grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 px-1 pb-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
        <div>Komponenta</div>
        <div>Forma</div>
        <div className="text-right pr-0.5">Kontakt</div>
      </div>
      <ul className="space-y-2 mt-0.5" role="list">
        {components.map((c, index) => (
          <li
            key={`${c.kod}-${c.nazev}-${index}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 md:px-5 py-3 shadow-sm transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-500/70 hover:shadow-md hover:-translate-y-0.5 min-h-[4.5rem]"
          >
            <RadekExterniKomponenty component={c} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- Row tile ---
type RadekExterniKomponentyProps = {
  component: ExternalComponent
}

function RadekExterniKomponenty({ component }: RadekExterniKomponentyProps) {
  const popisOneLine = (component.popis || '').replace(/\n/g, ' ').trim()
  const popisTruncated =
    popisOneLine.length > 120 ? `${popisOneLine.slice(0, 120)}…` : popisOneLine

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-4">
      {/* Zóna 1: identita */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2 gap-y-0.5">
          <span className="text-base font-semibold text-white leading-tight">
            {component.nazev || '—'}
          </span>
          {component.kod && (
            <span className="inline-flex items-center rounded border border-gray-600/50 bg-gray-800/70 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 leading-tight">
              {component.kod}
            </span>
          )}
        </div>
        {component.dodavatel && (
          <div className="text-xs text-gray-400 leading-snug mt-0.5">{component.dodavatel}</div>
        )}
        {popisTruncated && (
          <div
            className="text-[11px] text-gray-500 leading-snug line-clamp-2 mt-0.5"
            title={popisOneLine || undefined}
          >
            {popisTruncated}
          </div>
        )}
      </div>
      {/* Zóna 2: forma */}
      <div className="flex flex-wrap gap-1.5 lg:justify-start lg:items-center min-h-[2rem] lg:min-h-0">
        {component.forma_kom ? (
          <StavovyBadgeForma label={component.forma_kom} />
        ) : (
          <span className="text-[11px] text-gray-500">—</span>
        )}
      </div>
      {/* Zóna 3: kontakt */}
      <div className="lg:text-right lg:leading-tight min-h-[2rem] lg:min-h-0 flex items-start lg:items-center lg:justify-end">
        <KontaktKomponenty
          jmeno={component.jmeno}
          prijmeni={component.prijmeni}
          email={component.email}
          telefon={component.telefon}
        />
      </div>
    </div>
  )
}

// --- Contact (anchor + span pattern) ---
type KontaktKomponentyProps = {
  jmeno: string
  prijmeni: string
  email?: string
  telefon?: string
}

function KontaktKomponenty({ jmeno, prijmeni, email, telefon }: KontaktKomponentyProps) {
  const hasAnyContact = Boolean(jmeno || prijmeni || email || telefon)
  const linkBase =
    'group inline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
  const spanMuted = 'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'

  if (!hasAnyContact) {
    return (
      <div className="flex flex-col items-start gap-0 text-xs lg:items-end">
        <span className="text-gray-500/80 text-[11px] italic">Bez kontaktu</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1 text-xs lg:items-end lg:leading-snug">
      {(jmeno || prijmeni) && (
        <div className="text-gray-200 font-medium leading-tight">
          {[jmeno, prijmeni].filter(Boolean).join(' ')}
        </div>
      )}
      {email ? (
        <a href={`mailto:${email}`} className={`${linkBase} break-all`}>
          <span className={spanMuted}>{email}</span>
        </a>
      ) : (
        <span className="text-gray-500">—</span>
      )}
      {telefon ? (
        <a href={`tel:${telefon}`} className={linkBase}>
          <span className={spanMuted}>{telefon}</span>
        </a>
      ) : (
        <span className="text-gray-500">—</span>
      )}
    </div>
  )
}

// --- Badge for forma_kom ---
function StavovyBadgeForma({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-600/60 bg-gray-800/60 px-2.5 py-1 text-xs font-medium text-gray-300 leading-snug">
      {label}
    </span>
  )
}

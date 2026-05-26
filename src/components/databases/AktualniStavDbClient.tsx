'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Database } from '@/types/database'
import { DatabaseService } from '@/lib/database-service'
import DataChart, { type ChartSeries, type ChartType } from '@/components/charts/DataChart'
import { useServiceProjects } from '@/lib/useServiceProjects'

type DbStatusFilter = '' | 'kriticke' | 'varovani' | 'ok'

type Props = {
  initialDatabases: Database[]
  initialProjekt: string
  initialStatus: DbStatusFilter
  lastUpdated: string | null
  serverError: string | null
}

type SelectedDbKey = {
  projekt: string
  databaze: string
  firma: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeStatusFilter(value: string | null | undefined): DbStatusFilter {
  return value === 'kriticke' || value === 'varovani' || value === 'ok' ? value : ''
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function splitDateTime(raw: string | null | undefined): { date: string; time: string } {
  if (!raw) return { date: '—', time: '' }
  const d = new Date(raw)
  if (isNaN(d.getTime())) {
    return { date: raw, time: '' }
  }
  const date = d.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { date, time }
}

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 90)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

function usagePercentDb(db: Database): number {
  return DatabaseService.calculateUsagePercentage(db.velikost - db.velikost_volne, db.velikost_max)
}

function usagePercentLog(db: Database): number {
  return DatabaseService.calculateUsagePercentage(db.velikost_log - db.velikost_log_volne, db.velikost_log_max)
}

function remainingDbToMax(db: Database): number {
  return Math.max(0, db.velikost_max - (db.velikost - db.velikost_volne))
}

function remainingLogToMax(db: Database): number {
  return Math.max(0, db.velikost_log_max - (db.velikost_log - db.velikost_log_volne))
}

function hasDaysEstimate(db: Database): boolean {
  return db.volne_zbyva_dni >= 0
}

function formatDaysEstimate(days: number): string {
  return days >= 0 ? `${clampInt(days, 0, 9999)} d` : 'N/A'
}

function isCritical(db: Database): boolean {
  const u = usagePercentDb(db)
  const l = usagePercentLog(db)
  return u >= 90 || l >= 95 || (hasDaysEstimate(db) && db.volne_zbyva_dni <= 30)
}

function isWarning(db: Database): boolean {
  if (isCritical(db)) return false
  const u = usagePercentDb(db)
  const l = usagePercentLog(db)
  return u >= 75 || l >= 80 || (hasDaysEstimate(db) && db.volne_zbyva_dni <= 90)
}

function formatLastUpdated(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StavovyBadge({
  label,
  tone,
}: {
  label: string
  tone: 'ok' | 'warn' | 'crit' | 'neutral'
}) {
  const cls =
    tone === 'crit'
      ? 'border-red-700/50 bg-red-900/30 text-red-200/90'
      : tone === 'warn'
        ? 'border-amber-700/50 bg-amber-900/30 text-amber-200/90'
        : tone === 'ok'
          ? 'border-emerald-700/40 bg-emerald-900/25 text-emerald-200/90'
          : 'border-gray-700/50 bg-gray-900/50 text-gray-300'

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-snug ${cls}`}>
      {label}
    </span>
  )
}

function HlavickaAktualnihoStavuDb({
  lastUpdated,
  onRefresh,
  summary,
}: {
  lastUpdated: string | null
  onRefresh: () => void
  summary: { total: number; crit: number; warn: number; ok: number }
}) {
  return (
    <header className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
      <div className="flex flex-col gap-2.5">
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
          <span className="text-gray-300">Stav databází</span>
        </nav>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">Aktuální stav databází</h1>
            <p className="mt-0.5 text-sm text-gray-400 leading-snug">
              Monitoring stavu, využití a základních metrik DB v IS KARAT.
            </p>
            <div className="mt-1.5 text-xs text-gray-500">
              Aktualizováno: <span className="text-gray-300 tabular-nums">{formatLastUpdated(lastUpdated)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors shrink-0"
            >
              Obnovit
            </button>
            <dl className="grid grid-cols-4 gap-x-3 gap-y-1 sm:flex sm:gap-4 text-right">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Celkem</dt>
                <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">{summary.total}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Kritické</dt>
                <dd className="text-sm font-semibold text-red-200/90 mt-0.5 tabular-nums">{summary.crit}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Varování</dt>
                <dd className="text-sm font-semibold text-amber-200/90 mt-0.5 tabular-nums">{summary.warn}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">OK</dt>
                <dd className="text-sm font-semibold text-emerald-200/90 mt-0.5 tabular-nums">{summary.ok}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </header>
  )
}

function FiltryAktualnihoStavuDb({
  searchTerm,
  onSearchChange,
  selectedCompany,
  onCompanyChange,
  companies,
  selectedProject,
  onProjectChange,
  onClearProject,
  selectedStatus,
  onStatusChange,
  projectLabel,
  projectOptions,
  filteredCount,
  totalCount,
}: {
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedCompany: string
  onCompanyChange: (v: string) => void
  companies: string[]
  selectedProject: string
  onProjectChange: (v: string) => void
  onClearProject: () => void
  selectedStatus: DbStatusFilter
  onStatusChange: (v: string) => void
  projectLabel: string | null
  projectOptions: { value: string; label: string }[]
  filteredCount: number
  totalCount: number
}) {
  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
      <div className="flex flex-col gap-3">
        {selectedProject ? (
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-100/90">
                Filtrováno podle projektu:{' '}
                <span className="text-blue-200/90">{projectLabel ?? selectedProject}</span>
              </div>
              <button
                type="button"
                onClick={onClearProject}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20 transition-colors text-xs"
              >
                <span className="text-blue-200/90">Zrušit filtr</span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-3.5 md:py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 w-full min-w-0">
              <div className="w-full min-w-0 sm:max-w-md">
                <label htmlFor="db-search" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Hledat
                </label>
                <input
                  id="db-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Firma, projekt, DB, ID firmy…"
                  className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                />
              </div>

              <div className="w-full sm:w-72">
                <label htmlFor="db-projekt" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Projekt
                </label>
                <select
                  id="db-projekt"
                  value={selectedProject}
                  onChange={(e) => onProjectChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                >
                  <option value="">Všechny projekty</option>
                  {projectOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label htmlFor="db-status" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Stav
                </label>
                <select
                  id="db-status"
                  value={selectedStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                >
                  <option value="">Všechny stavy</option>
                  <option value="kriticke">Kritické</option>
                  <option value="varovani">Varování</option>
                  <option value="ok">OK</option>
                </select>
              </div>

              <div className="w-full sm:w-72">
                <label htmlFor="db-company" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Firma
                </label>
                <select
                  id="db-company"
                  value={selectedCompany}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                >
                  <option value="">Všechny firmy</option>
                  {companies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-500 sm:text-right shrink-0">
              Zobrazeno <span className="font-medium text-gray-300 tabular-nums">{filteredCount}</span> z{' '}
              <span className="font-medium text-gray-300 tabular-nums">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KartaDatabaze({
  db,
  selected,
  onSelect,
}: {
  db: Database
  selected: boolean
  onSelect: () => void
}) {
  const u = usagePercentDb(db)
  const l = usagePercentLog(db)
  const tone: 'crit' | 'warn' | 'ok' = isCritical(db) ? 'crit' : isWarning(db) ? 'warn' : 'ok'
  const daysLabel = formatDaysEstimate(db.volne_zbyva_dni)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-3.5 py-3.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
        selected
          ? 'border-slate-500/40 bg-slate-900/55 ring-1 ring-sky-500/15 border-l-[3px] border-l-sky-400/40'
          : 'border-gray-700/70 bg-gray-900/40 border-l-[3px] border-l-transparent hover:bg-gray-800/70 hover:border-gray-500/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-[15px] font-semibold text-white truncate leading-snug"
            title={`${db.firma_nazev} / ${db.projekt} / ${db.databaze}`}
          >
            {db.databaze}
          </div>
          <div className="mt-0.5 text-xs text-gray-400 truncate">{db.firma_nazev}</div>
          <div className="text-[11px] text-gray-500 font-mono truncate">{db.projekt}</div>
        </div>
        <StavovyBadge label={tone === 'crit' ? 'Kritické' : tone === 'warn' ? 'Varování' : 'OK'} tone={tone} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Data</div>
          <div className="text-gray-200 tabular-nums">{u}%</div>
        </div>
        <div>
          <div className="text-gray-500">Log</div>
          <div className="text-gray-200 tabular-nums">{l}%</div>
        </div>
        <div>
          <div className="text-gray-500">Volné dny</div>
          <div className="text-gray-200 tabular-nums">{daysLabel}</div>
        </div>
      </div>
    </button>
  )
}

function SeznamDatabazi({
  databases,
  selectedKey,
  onSelect,
}: {
  databases: Database[]
  selectedKey: SelectedDbKey | null
  onSelect: (db: Database) => void
}) {
  if (!databases.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
        <h3 className="text-base font-semibold text-white">Žádné databáze</h3>
        <p className="mt-1 text-sm text-gray-400 leading-snug">Aktuální filtr nevrátil žádné databáze k zobrazení.</p>
      </div>
    )
  }

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/40">
        <h2 className="text-sm font-semibold text-white">Seznam databází</h2>
        <p className="text-xs text-gray-500 mt-0.5">Klikněte na řádek pro zobrazení detailu a grafů.</p>
      </div>

      {/* Desktop: table-like — compact but čitelný */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="flex border-b border-gray-700 bg-gray-800/50 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <div className="px-3 py-2.5 flex-1 min-w-[220px]">Databáze / Firma</div>
            <div className="px-2 py-2 w-[72px] flex-shrink-0 text-center">Data %</div>
            <div className="px-2 py-2 w-[72px] flex-shrink-0 text-center">Log %</div>
            <div className="px-2 py-2 w-[76px] flex-shrink-0 text-center">Dny</div>
            <div className="px-2 py-2 w-[70px] flex-shrink-0 text-center">Rec.</div>
            <div className="px-3 py-2 w-[132px] flex-shrink-0 text-right">Posl. full</div>
          </div>

          {databases.map((db, idx) => {
            const key: SelectedDbKey = { projekt: db.projekt, databaze: db.databaze, firma: db.firma_nazev }
            const selected =
              selectedKey?.projekt === key.projekt &&
              selectedKey.databaze === key.databaze &&
              selectedKey.firma === key.firma

            const u = usagePercentDb(db)
            const l = usagePercentLog(db)
            const tone: 'crit' | 'warn' | 'ok' = isCritical(db) ? 'crit' : isWarning(db) ? 'warn' : 'ok'
            const { date, time } = splitDateTime(db.backup_full)
            const daysLabel = formatDaysEstimate(db.volne_zbyva_dni)
            const daysClass = hasDaysEstimate(db)
              ? DatabaseService.getDaysRemainingColor(db.volne_zbyva_dni)
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'

            return (
              <button
                key={`${db.projekt}-${db.databaze}-${idx}`}
                type="button"
                onClick={() => onSelect(db)}
                className={`w-full flex text-left border-b border-gray-700 border-l-[3px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                  selected
                    ? 'bg-gray-800/85 border-l-green-500/60'
                    : 'bg-transparent border-l-transparent hover:bg-gray-800/55'
                }`}
              >
                <div className="px-3 py-2.5 flex-1 min-w-[220px] min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[15px] font-semibold text-white truncate shrink min-w-0 leading-snug"
                      title={db.databaze}
                    >
                      {db.databaze}
                    </span>
                    <StavovyBadge
                      label={tone === 'crit' ? 'Kritické' : tone === 'warn' ? 'Varování' : 'OK'}
                      tone={tone}
                    />
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5" title={`${db.firma_nazev} · ${db.projekt}`}>
                    {db.firma_nazev}
                    <span className="text-gray-600 mx-0.5">·</span>
                    <span className="font-mono text-[11px] text-gray-500">{db.projekt}</span>
                  </div>
                </div>

                <div className="px-2 py-2 w-[72px] flex-shrink-0 flex items-center justify-center">
                  <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${DatabaseService.getUsageColor(u)}`}>
                    {u}%
                  </span>
                </div>
                <div className="px-2 py-2 w-[72px] flex-shrink-0 flex items-center justify-center">
                  <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${DatabaseService.getLogUsageColor(l)}`}>
                    {l}%
                  </span>
                </div>
                <div className="px-2 py-2 w-[76px] flex-shrink-0 flex items-center justify-center">
                  <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${daysClass}`}>
                    {daysLabel}
                  </span>
                </div>
                <div className="px-2 py-2 w-[70px] flex-shrink-0 flex items-center justify-center">
                  <span
                    className={`inline-flex px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${
                      db.recovery_model === 'FULL'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {db.recovery_model === 'FULL' ? 'FULL' : (db.recovery_model || '—')}
                  </span>
                </div>
                <div className="px-3 py-2 w-[132px] flex-shrink-0 text-right text-xs text-gray-200 tabular-nums">
                  <div className="leading-tight">{date}</div>
                  {time && <div className="text-[11px] text-gray-400">{time}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden p-3 space-y-2">
        {databases.map((db, idx) => {
          const selected =
            selectedKey?.projekt === db.projekt &&
            selectedKey.databaze === db.databaze &&
            selectedKey.firma === db.firma_nazev
          return (
            <KartaDatabaze
              key={`${db.projekt}-${db.databaze}-${idx}`}
              db={db}
              selected={selected}
              onSelect={() => onSelect(db)}
            />
          )
        })}
      </div>
    </div>
  )
}

function AkceAktualnihoStavuDb({
  projekt,
  databaze,
  dateFrom,
  dateTo,
}: {
  projekt: string
  databaze: string
  dateFrom: string
  dateTo: string
}) {
  const exportParams = new URLSearchParams()
  exportParams.set('projekt', projekt)
  exportParams.set('database', databaze)
  exportParams.set('startDate', dateFrom)
  exportParams.set('endDate', dateTo)

  const exportHref = `/api/database-chart/export?${exportParams.toString()}`
  const erpHref = 'http://itmsql01:44612/web/databases'

  const linkBase =
    'group inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors'
  const spanPrimary = 'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'

  return (
    <div className="flex flex-wrap gap-2">
      <a href={exportHref} className={linkBase}>
        <span className={spanPrimary}>Export CSV</span>
      </a>
      <a href={erpHref} target="_blank" rel="noopener noreferrer" className={linkBase}>
        <span className={spanPrimary}>Otevřít ERP</span>
      </a>
    </div>
  )
}

function GrafVyvojeDatabaze({
  selected,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  selected: SelectedDbKey
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [data, setData] = useState<ChartSeries[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setData(null)

        const params = new URLSearchParams()
        params.set('projekt', selected.projekt)
        params.set('database', selected.databaze)
        params.set('startDate', dateFrom)
        params.set('endDate', dateTo)

        const response = await fetch(`/api/database-chart?${params.toString()}`)
        const json = await response.json()
        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Nepodařilo se načíst historii databáze')
        }

        if (!cancelled) {
          setData((json.data || []) as ChartSeries[])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Došlo k chybě při načítání grafu')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [selected.projekt, selected.databaze, dateFrom, dateTo])

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-3 md:px-4 md:py-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Graf vývoje velikosti</div>
            <div className="text-xs text-gray-500">
              {selected.projekt} <span className="text-gray-600">·</span> {selected.databaze}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Od</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="px-2.5 py-2 rounded-lg bg-gray-800/80 border border-gray-600/60 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Do</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="px-2.5 py-2 rounded-lg bg-gray-800/80 border border-gray-600/60 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              />
            </div>

            <div className="flex gap-1 p-1 bg-gray-800/80 border border-gray-700/60 rounded-lg">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                  chartType === 'line' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                  chartType === 'area' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                  chartType === 'bar' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700/70'
                }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-5 bg-gray-700/60 rounded w-1/2" />
            <div className="h-60 bg-gray-700/40 rounded-lg" />
            <div className="h-60 bg-gray-700/40 rounded-lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-4">
            <div className="text-sm font-semibold text-amber-100/90">Chyba načtení grafu</div>
            <p className="mt-1 text-sm text-amber-100/80 leading-snug">{error}</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-4">
            <div className="text-sm font-semibold text-white">Žádná data</div>
            <p className="mt-1 text-sm text-gray-400 leading-snug">Pro zadané období nebyla nalezena žádná data historie.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DB / MDF graf */}
            <div className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-300">Vývoj databáze (MDF)</div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {data.slice(0, 3).map((series) => (
                    <div key={series.name} className="inline-flex items-center gap-1 text-gray-300">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: series.color || '#3b82f6' }}
                      />
                      <span>{series.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <DataChart
                title={undefined}
                type={chartType}
                data={data.slice(0, 3)}
                height={320}
                showLegend={false}
                showGrid={true}
                xAxisLabel="Datum"
                yAxisLabel="Velikost"
                className="bg-transparent shadow-none"
              />
            </div>

            {/* Log graf */}
            <div className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-300">Vývoj logu (LDF)</div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {data.slice(3, 6).map((series) => (
                    <div key={series.name} className="inline-flex items-center gap-1 text-gray-300">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: series.color || '#3b82f6' }}
                      />
                      <span>{series.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <DataChart
                title={undefined}
                type={chartType}
                data={data.slice(3, 6)}
                height={320}
                showLegend={false}
                showGrid={true}
                xAxisLabel="Datum"
                yAxisLabel="Velikost"
                className="bg-transparent shadow-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailDatabaze({
  selectedDb,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  selectedDb: Database
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}) {
  const selectedKey: SelectedDbKey = {
    projekt: selectedDb.projekt,
    databaze: selectedDb.databaze,
    firma: selectedDb.firma_nazev,
  }

  const u = usagePercentDb(selectedDb)
  const l = usagePercentLog(selectedDb)
  const dbRemainingToMax = DatabaseService.formatSize(remainingDbToMax(selectedDb))
  const logRemainingToMax = DatabaseService.formatSize(remainingLogToMax(selectedDb))
  const daysLabel = formatDaysEstimate(selectedDb.volne_zbyva_dni)

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate" title={`${selectedDb.databaze} / ${selectedDb.firma_nazev}`}>
              Detail: {selectedDb.databaze}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {selectedDb.firma_nazev} <span className="text-gray-600">·</span>{' '}
              <span className="font-mono text-[11px]">{selectedDb.projekt}</span>
            </p>
          </div>
          <AkceAktualnihoStavuDb projekt={selectedDb.projekt} databaze={selectedDb.databaze} dateFrom={dateFrom} dateTo={dateTo} />
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Obsazeno z limitu</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getUsageColor(u)}`}>
                {u}%
              </span>
              <span className="text-xs text-gray-400">{dbRemainingToMax} zbývá do max</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Log využití</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getLogUsageColor(l)}`}>
                {l}%
              </span>
              <span className="text-xs text-gray-400">{logRemainingToMax} zbývá do max</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="text-gray-500">Recovery</div>
            <div className="text-gray-200">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedDb.recovery_model === 'FULL'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}
              >
                {selectedDb.recovery_model || '—'}
              </span>
            </div>

            <div className="text-gray-500">Verze</div>
            <div className="text-gray-200 font-mono text-[11px]">{selectedDb.verze || '—'}</div>

            <div className="text-gray-500">Poslední full backup</div>
            <div className="text-gray-200 tabular-nums">{DatabaseService.formatDate(selectedDb.backup_full)}</div>

            <div className="text-gray-500">Poslední inc backup</div>
            <div className="text-gray-200 tabular-nums">{DatabaseService.formatDate(selectedDb.backup_inc)}</div>

            <div className="text-gray-500">Volné dny</div>
            <div className="text-gray-200 tabular-nums">{daysLabel}</div>

            <div className="text-gray-500">Denní nárůst</div>
            <div className="text-gray-200 tabular-nums">{selectedDb.denni_narust_mb ? `${selectedDb.denni_narust_mb} MB` : '—'}</div>

            <div className="text-gray-500">Compatibility level</div>
            <div className="text-gray-200 tabular-nums">{selectedDb.compatibility_level || '—'}</div>

            <div className="text-gray-500">Collation</div>
            <div className="text-gray-200 font-mono text-[11px] truncate" title={selectedDb.collation_name}>
              {selectedDb.collation_name || '—'}
            </div>

            <div className="text-gray-500">Delayed durability</div>
            <div className="text-gray-200 font-mono text-[11px]">{selectedDb.delayed_durability || '—'}</div>
          </div>
        </div>

        <GrafVyvojeDatabaze
          selected={selectedKey}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
        />
      </div>
    </div>
  )
}

export default function AktualniStavDbClient({
  initialDatabases,
  initialProjekt,
  initialStatus,
  lastUpdated,
  serverError,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { labelByDoklad, projects: serviceProjects } = useServiceProjects()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedProject, setSelectedProject] = useState(initialProjekt)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const mobileDetailCloseButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [dateFrom, setDateFrom] = useState(defaultRange.start)
  const [dateTo, setDateTo] = useState(defaultRange.end)

  const databases = initialDatabases

  const companies = useMemo(() => {
    // Keep company filter consistent with project pin:
    // when a project is selected, only show companies that exist for that project.
    const base = selectedProject
      ? databases.filter((d) => String(d.projekt ?? '').trim() === selectedProject)
      : databases

    return [...new Set(base.map((d) => d.firma_nazev).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'))
  }, [databases, selectedProject])

  // If project changes and the selected company is no longer valid, clear the company pin.
  useEffect(() => {
    if (!selectedProject) return
    if (!selectedCompany) return
    if (!companies.includes(selectedCompany)) queueMicrotask(() => setSelectedCompany(''))
  }, [companies, selectedCompany, selectedProject])

  const projectOptions = useMemo(() => {
    const available = new Set(databases.map((d) => (d.projekt ?? '').trim()).filter(Boolean))
    const options = serviceProjects
      .filter((p) => available.has((p.doklad_proj ?? '').trim()))
      .map((p) => ({
        value: (p.doklad_proj ?? '').trim(),
        label: labelByDoklad.get((p.doklad_proj ?? '').trim()) ?? (p.doklad_proj ?? '').trim(),
      }))
      .filter((p) => p.value)
      .sort((a, b) => a.label.localeCompare(b.label, 'cs'))

    if (selectedProject && !options.some((o) => o.value === selectedProject)) {
      return [{ value: selectedProject, label: labelByDoklad.get(selectedProject) ?? selectedProject }, ...options]
    }
    return options
  }, [databases, labelByDoklad, selectedProject, serviceProjects])

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProject) return null
    return labelByDoklad.get(selectedProject) ?? null
  }, [labelByDoklad, selectedProject])

  const filteredDatabases = useMemo(() => {
    const q = normalize(searchTerm)
    return databases.filter((d) => {
      const matchesSearch =
        !q ||
        normalize(d.firma_nazev).includes(q) ||
        normalize(d.projekt).includes(q) ||
        normalize(d.databaze).includes(q) ||
        normalize(d.id_firmy).includes(q)

      const matchesCompany = !selectedCompany || d.firma_nazev === selectedCompany
      const matchesProject = !selectedProject || d.projekt === selectedProject
      const matchesStatus =
        !selectedStatus ||
        (selectedStatus === 'kriticke' && isCritical(d)) ||
        (selectedStatus === 'varovani' && isWarning(d)) ||
        (selectedStatus === 'ok' && !isCritical(d) && !isWarning(d))

      return matchesSearch && matchesCompany && matchesProject && matchesStatus
    })
  }, [databases, searchTerm, selectedCompany, selectedProject, selectedStatus])

  const overview = useMemo(() => {
    const total = filteredDatabases.length
    const crit = filteredDatabases.filter(isCritical).length
    const warn = filteredDatabases.filter(isWarning).length
    const ok = Math.max(0, total - crit - warn)
    return { total, crit, warn, ok }
  }, [filteredDatabases])

  const [selectedKey, setSelectedKey] = useState<SelectedDbKey | null>(null)

  const selectedDb = useMemo(() => {
    if (!selectedKey) return null
    return (
      filteredDatabases.find(
        (d) => d.projekt === selectedKey.projekt && d.databaze === selectedKey.databaze && d.firma_nazev === selectedKey.firma,
      ) ?? null
    )
  }, [filteredDatabases, selectedKey])

  // Default selection rules
  useEffect(() => {
    if (!filteredDatabases.length) {
      if (selectedKey) queueMicrotask(() => setSelectedKey(null))
      return
    }

    // Keep selection if still present
    if (selectedDb) return

    let next: Database | undefined
    if (selectedProject) {
      next = filteredDatabases.find((d) => d.projekt === selectedProject)
    }
    if (!next) {
      next = filteredDatabases.find(isCritical)
    }
    if (!next) {
      next = filteredDatabases[0]
    }
    if (next) {
      queueMicrotask(() => setSelectedKey({ projekt: next.projekt, databaze: next.databaze, firma: next.firma_nazev }))
    }
  }, [filteredDatabases, selectedDb, selectedKey, selectedProject])

  const onProjectChange = (value: string) => {
    setSelectedProject(value)
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    if (value) current.set('projekt', value)
    else current.delete('projekt')
    const qs = current.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const onClearProject = () => {
    setSelectedProject('')
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    current.delete('projekt')
    const qs = current.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const onStatusChange = (value: string) => {
    const normalized = normalizeStatusFilter(value)
    setSelectedStatus(normalized)
    const current = new URLSearchParams(searchParams?.toString() ?? '')
    if (normalized) current.set('stav', normalized)
    else current.delete('stav')
    const qs = current.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const onRefresh = () => {
    router.refresh()
  }

  // Mobile detail overlay: scroll lock + Escape close + minimal focus management.
  useEffect(() => {
    if (!mobileDetailOpen) return

    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDetailOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)

    window.setTimeout(() => {
      mobileDetailCloseButtonRef.current?.focus()
    }, 0)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.()
      restoreFocusRef.current = null
    }
  }, [mobileDetailOpen])

  if (serverError) {
    return (
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-amber-100/90">Chyba načtení</div>
            <p className="mt-1 text-sm text-amber-100/80 leading-snug">
              Nepodařilo se načíst seznam databází. Zkuste to prosím později.
            </p>
            <p className="mt-2 text-[11px] text-amber-200/60 font-mono break-all">{serverError}</p>
          </div>
          <a
            href="http://itmsql01:44612/web/databases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30 transition-colors text-xs shrink-0"
          >
            <span className="text-amber-100/90">Otevřít ERP</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <HlavickaAktualnihoStavuDb lastUpdated={lastUpdated} onRefresh={onRefresh} summary={overview} />
      <FiltryAktualnihoStavuDb
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        companies={companies}
        selectedProject={selectedProject}
        onProjectChange={onProjectChange}
        onClearProject={onClearProject}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        projectLabel={selectedProjectLabel}
        projectOptions={projectOptions}
        filteredCount={filteredDatabases.length}
        totalCount={databases.length}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] gap-4 items-start">
        <SeznamDatabazi
          databases={filteredDatabases}
          selectedKey={selectedKey}
          onSelect={(db) => {
            setSelectedKey({ projekt: db.projekt, databaze: db.databaze, firma: db.firma_nazev })
            setMobileDetailOpen(true)
          }}
        />

        {/* Desktop/tablet: keep current inline/sticky detail (mobile uses overlay). */}
        <div className="hidden md:block xl:sticky xl:top-6 space-y-4">
          {selectedDb ? (
            <DetailDatabaze
              selectedDb={selectedDb}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          ) : (
            <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6">
              <div className="text-sm font-semibold text-white">Vyberte databázi</div>
              <p className="mt-1 text-sm text-gray-400 leading-snug">Klikněte na položku v seznamu a zobrazí se detail a grafy.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: full-screen overlay detail (prevents "detail under list"). */}
      {selectedDb && mobileDetailOpen ? (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Detail databáze">
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-gray-950 shadow-strong ring-1 ring-gray-800/60">
            <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80">
              <div className="px-4 py-2.5 flex items-center gap-3">
                <button
                  ref={mobileDetailCloseButtonRef}
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-700/60 bg-gray-900/40 hover:bg-gray-800/60 text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  aria-label="Zpět"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ←
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white truncate" title={selectedDb.databaze}>
                    {selectedDb.databaze}
                  </div>
                  <div
                    className="mt-0.5 text-[11px] text-gray-400/90 truncate"
                    title={`${selectedDb.firma_nazev} · ${selectedDb.projekt}`}
                  >
                    {selectedDb.firma_nazev} <span className="text-gray-600">·</span>{' '}
                    <span className="font-mono text-[11px] text-gray-500">{selectedDb.projekt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8">
              <DetailDatabaze
                selectedDb={selectedDb}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


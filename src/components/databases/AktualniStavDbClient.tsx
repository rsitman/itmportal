'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { DatabaseService } from '@/lib/database-service'
import DataChart, { type ChartSeries, type ChartType } from '@/components/charts/DataChart'

type Props = {
  initialDatabases: Database[]
  initialProjekt: string
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

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
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

function isCritical(db: Database): boolean {
  const u = usagePercentDb(db)
  const l = usagePercentLog(db)
  return u >= 90 || l >= 95 || db.volne_zbyva_dni <= 30
}

function isWarning(db: Database): boolean {
  if (isCritical(db)) return false
  const u = usagePercentDb(db)
  const l = usagePercentLog(db)
  return u >= 75 || l >= 80 || db.volne_zbyva_dni <= 90
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
}: {
  lastUpdated: string | null
  onRefresh: () => void
}) {
  return (
    <header className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Aktuální stav databází</h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">Monitoring stavu, využití a základních metrik DB v IS KARAT.</p>
          <div className="mt-2 text-xs text-gray-500">
            Aktualizováno: <span className="text-gray-300 tabular-nums">{formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors shrink-0"
        >
          Obnovit
        </button>
      </div>
    </header>
  )
}

function PrehledAktualnihoStavuDb({
  total,
  crit,
  warn,
  ok,
}: {
  total: number
  crit: number
  warn: number
  ok: number
}) {
  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <header className="border-b border-gray-700/50 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Přehled stavu</h2>
            <p className="mt-1 text-sm text-gray-400 leading-snug">Rychlá orientace podle kapacity a predikce volného místa.</p>
          </div>
          <dl className="grid grid-cols-4 gap-x-4 gap-y-0.5 sm:flex sm:gap-6 sm:text-right shrink-0">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Celkem</dt>
              <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">{total}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Kritické</dt>
              <dd className="text-sm font-semibold text-red-200/90 mt-0.5 tabular-nums">{crit}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Varování</dt>
              <dd className="text-sm font-semibold text-amber-200/90 mt-0.5 tabular-nums">{warn}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">OK</dt>
              <dd className="text-sm font-semibold text-emerald-200/90 mt-0.5 tabular-nums">{ok}</dd>
            </div>
          </dl>
        </div>
      </header>
    </div>
  )
}

function FiltryAktualnihoStavuDb({
  searchTerm,
  onSearchChange,
  selectedCompany,
  onCompanyChange,
  companies,
  selectedProject,
  onClearProject,
  filteredCount,
  totalCount,
}: {
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedCompany: string
  onCompanyChange: (v: string) => void
  companies: string[]
  selectedProject: string
  onClearProject: () => void
  filteredCount: number
  totalCount: number
}) {
  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <header className="border-b border-gray-700/50 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Filtry</h2>
            <p className="mt-1 text-sm text-gray-400 leading-snug">Vyhledávání, firma a deep-link filtr projektu.</p>
          </div>
          <div className="text-xs text-gray-500 sm:text-right shrink-0">
            Zobrazeno <span className="font-medium text-gray-300 tabular-nums">{filteredCount}</span> z{' '}
            <span className="font-medium text-gray-300 tabular-nums">{totalCount}</span>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3">
        {selectedProject ? (
          <div className="rounded-lg border border-blue-700/40 bg-blue-900/15 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-100/90">
                Filtrováno podle projektu:{' '}
                <span className="font-mono text-[12px] text-blue-200/90">{selectedProject}</span>
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

        <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
        selected
          ? 'border-green-500/50 bg-gray-800/70'
          : 'border-gray-700/70 bg-gray-900/40 hover:bg-gray-800/70 hover:border-gray-500/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate" title={`${db.firma_nazev} / ${db.projekt} / ${db.databaze}`}>
            {db.databaze}
          </div>
          <div className="mt-0.5 text-xs text-gray-400 truncate">{db.firma_nazev}</div>
          <div className="text-[11px] text-gray-500 font-mono truncate">{db.projekt}</div>
        </div>
        <StavovyBadge label={tone === 'crit' ? 'Kritické' : tone === 'warn' ? 'Varování' : 'OK'} tone={tone} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">DB</div>
          <div className="text-gray-200 tabular-nums">{u}%</div>
        </div>
        <div>
          <div className="text-gray-500">Log</div>
          <div className="text-gray-200 tabular-nums">{l}%</div>
        </div>
        <div>
          <div className="text-gray-500">Volné dny</div>
          <div className="text-gray-200 tabular-nums">{db.volne_zbyva_dni}</div>
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

      {/* Desktop: table-like */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="flex border-b border-gray-700 bg-gray-800/50 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3 flex-1 min-w-[260px]">Databáze / Firma</div>
            <div className="px-4 py-3 w-[140px] flex-shrink-0 text-center">DB využití</div>
            <div className="px-4 py-3 w-[140px] flex-shrink-0 text-center">Log využití</div>
            <div className="px-4 py-3 w-[130px] flex-shrink-0 text-center">Volné dny</div>
            <div className="px-4 py-3 w-[130px] flex-shrink-0 text-center">Recovery</div>
            <div className="px-4 py-3 w-[170px] flex-shrink-0">Posl. full</div>
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

            return (
              <button
                key={`${db.projekt}-${db.databaze}-${idx}`}
                type="button"
                onClick={() => onSelect(db)}
                className={`w-full flex text-left border-b border-gray-700 hover:bg-gray-800/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                  selected ? 'bg-gray-800/70' : 'bg-transparent'
                }`}
              >
                <div className="px-4 py-3 flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-white truncate" title={db.databaze}>
                      {db.databaze}
                    </span>
                    <StavovyBadge
                      label={tone === 'crit' ? 'Kritické' : tone === 'warn' ? 'Varování' : 'OK'}
                      tone={tone}
                    />
                  </div>
                  <div className="text-xs text-gray-400 truncate" title={db.firma_nazev}>
                    {db.firma_nazev}{' '}
                    <span className="text-gray-600">·</span>{' '}
                    <span className="font-mono text-[11px] text-gray-500">{db.projekt}</span>
                  </div>
                </div>

                <div className="px-4 py-3 w-[140px] flex-shrink-0 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getUsageColor(u)}`}>
                    {u}%
                  </span>
                </div>
                <div className="px-4 py-3 w-[140px] flex-shrink-0 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getLogUsageColor(l)}`}>
                    {l}%
                  </span>
                </div>
                <div className="px-4 py-3 w-[130px] flex-shrink-0 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getDaysRemainingColor(db.volne_zbyva_dni)}`}>
                    {clampInt(db.volne_zbyva_dni, 0, 9999)} dní
                  </span>
                </div>
                <div className="px-4 py-3 w-[130px] flex-shrink-0 text-center">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      db.recovery_model === 'FULL'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {db.recovery_model || '—'}
                  </span>
                </div>
                <div className="px-4 py-3 w-[170px] flex-shrink-0 text-sm text-gray-200 tabular-nums">
                  {DatabaseService.formatDate(db.backup_full)}
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
  const [chartType, setChartType] = useState<ChartType>('line')
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
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">DB využití</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getUsageColor(u)}`}>
                {u}%
              </span>
              <span className="text-xs text-gray-400">
                {DatabaseService.formatSize(selectedDb.velikost_volne)} volné
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Log využití</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getLogUsageColor(l)}`}>
                {l}%
              </span>
              <span className="text-xs text-gray-400">
                {DatabaseService.formatSize(selectedDb.velikost_log_volne)} volné
              </span>
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
            <div className="text-gray-200 tabular-nums">{clampInt(selectedDb.volne_zbyva_dni, 0, 9999)}</div>

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
  lastUpdated,
  serverError,
}: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedProject, setSelectedProject] = useState(initialProjekt)

  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [dateFrom, setDateFrom] = useState(defaultRange.start)
  const [dateTo, setDateTo] = useState(defaultRange.end)

  const databases = initialDatabases

  const companies = useMemo(() => {
    return [...new Set(databases.map((d) => d.firma_nazev).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'))
  }, [databases])

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
      return matchesSearch && matchesCompany && matchesProject
    })
  }, [databases, searchTerm, selectedCompany, selectedProject])

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
      if (selectedKey) setSelectedKey(null)
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
      setSelectedKey({ projekt: next.projekt, databaze: next.databaze, firma: next.firma_nazev })
    }
  }, [filteredDatabases, selectedDb, selectedKey, selectedProject])

  const onClearProject = () => {
    setSelectedProject('')
    router.replace('/databases')
  }

  const onRefresh = () => {
    router.refresh()
  }

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
    <div className="space-y-6">
      <HlavickaAktualnihoStavuDb lastUpdated={lastUpdated} onRefresh={onRefresh} />
      <PrehledAktualnihoStavuDb total={overview.total} crit={overview.crit} warn={overview.warn} ok={overview.ok} />
      <FiltryAktualnihoStavuDb
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        companies={companies}
        selectedProject={selectedProject}
        onClearProject={onClearProject}
        filteredCount={filteredDatabases.length}
        totalCount={databases.length}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] gap-4 items-start">
        <SeznamDatabazi
          databases={filteredDatabases}
          selectedKey={selectedKey}
          onSelect={(db) => setSelectedKey({ projekt: db.projekt, databaze: db.databaze, firma: db.firma_nazev })}
        />

        <div className="xl:sticky xl:top-6 space-y-4">
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
    </div>
  )
}


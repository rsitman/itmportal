'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Upgrade } from '@/types/upgrade'
import { useServiceProjects } from '@/lib/useServiceProjects'

type PrehledUpgraduProps = {
  initialUpgrades: Upgrade[]
  initialProjekt?: string
  serverError?: string | null
}

const linkBase =
  'group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanLink =
  'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'
const spanLinkMuted =
  'text-gray-400 transition-colors duration-150 group-hover:text-gray-200'

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function formatDate(dateInput: string): string {
  if (!dateInput) return '—'
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function monthKey(dateInput: string): string | null {
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getStavBadgeClasses(stavRaw: string): { wrap: string; text: string } {
  const stav = normalizeText(stavRaw)

  const ok = new Set(['realizováno', 'hotovo', 'provedeno', 'dokončeno'])
  const preparing = new Set(['v přípravě', 'priprava', 'příprava'])
  const planned = new Set(['plánováno', 'planovano', 'naplánováno'])
  const paused = new Set(['pozastaveno', 'blokováno', 'blokovano'])

  if (paused.has(stav)) {
    return {
      wrap:
        'inline-flex items-center rounded-md border border-red-700/40 bg-red-900/25 px-2 py-0.5 text-[11px] font-medium leading-snug',
      text: 'text-red-200/90',
    }
  }
  if (preparing.has(stav)) {
    return {
      wrap:
        'inline-flex items-center rounded-md border border-amber-700/40 bg-amber-900/25 px-2 py-0.5 text-[11px] font-medium leading-snug',
      text: 'text-amber-200/90',
    }
  }
  if (planned.has(stav)) {
    return {
      wrap:
        'inline-flex items-center rounded-md border border-blue-700/40 bg-blue-900/25 px-2 py-0.5 text-[11px] font-medium leading-snug',
      text: 'text-blue-200/90',
    }
  }
  if (ok.has(stav)) {
    return {
      wrap:
        'inline-flex items-center rounded-md border border-emerald-700/40 bg-emerald-900/25 px-2 py-0.5 text-[11px] font-medium leading-snug',
      text: 'text-emerald-200/90',
    }
  }

  return {
    wrap:
      'inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/50 px-2 py-0.5 text-[11px] font-medium leading-snug',
    text: 'text-gray-300',
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'))
}

export default function PrehledUpgradu({
  initialUpgrades,
  initialProjekt = '',
  serverError = null,
}: PrehledUpgraduProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjekt, setSelectedProjekt] = useState(initialProjekt)
  const [selectedStav, setSelectedStav] = useState('vse')

  const { labelByDoklad } = useServiceProjects()

  const projekty = useMemo(
    () => uniqueSorted(initialUpgrades.map((u) => u.projekt)),
    [initialUpgrades],
  )

  const projektyForSelect = useMemo(() => {
    if (!selectedProjekt) return projekty
    return projekty.includes(selectedProjekt) ? projekty : uniqueSorted([selectedProjekt, ...projekty])
  }, [projekty, selectedProjekt])

  const dostupneStavy = useMemo(
    () => uniqueSorted(initialUpgrades.map((u) => u.stav)),
    [initialUpgrades],
  )

  const filteredUpgrades = useMemo(() => {
    const q = normalizeText(searchTerm)
    const projekt = selectedProjekt.trim()
    const stav = selectedStav

    return initialUpgrades.filter((u) => {
      const matchesProjekt = !projekt || u.projekt === projekt
      const matchesStav = stav === 'vse' || normalizeText(u.stav) === normalizeText(stav)
      const matchesSearch =
        !q ||
        normalizeText(u.nazev).includes(q) ||
        normalizeText(u.projekt).includes(q) ||
        normalizeText(u.resitel).includes(q) ||
        normalizeText(u.jira_klic).includes(q) ||
        normalizeText(u.verze).includes(q)

      return matchesProjekt && matchesStav && matchesSearch
    })
  }, [initialUpgrades, searchTerm, selectedProjekt, selectedStav])

  const stats = useMemo(() => {
    const total = initialUpgrades.length
    const projects = projekty.length
    const now = new Date()
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonth = initialUpgrades.filter((u) => monthKey(u.datum_od) === currentKey).length
    return { total, projects, thisMonth }
  }, [initialUpgrades, projekty])

  const onProjektChange = (value: string) => {
    setSelectedProjekt(value)
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set('projekt', value)
    else current.delete('projekt')
    router.replace(`/upgrades?${current.toString()}`)
  }

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <HlavickaUpgradu
        total={stats.total}
        projects={stats.projects}
        thisMonth={stats.thisMonth}
      />

      <div className="mt-4 flex flex-col gap-3">
        <FiltryUpgradu
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedProjekt={selectedProjekt}
          onProjektChange={onProjektChange}
          projekty={projektyForSelect}
          projectLabelByDoklad={labelByDoklad}
          selectedStav={selectedStav}
          onStavChange={setSelectedStav}
          dostupneStavy={dostupneStavy}
          filteredCount={filteredUpgrades.length}
          totalCount={initialUpgrades.length}
        />

        {serverError ? (
          <ErrorState message={serverError} />
        ) : initialUpgrades.length === 0 ? (
          <EmptyState title="Žádné upgrady" message="Nebyly nalezeny žádné upgrady k zobrazení." />
        ) : filteredUpgrades.length === 0 ? (
          <EmptyState
            title="Bez výsledků"
            message="Žádné upgrady neodpovídají filtrům. Zkuste upravit vyhledávání nebo filtry."
          />
        ) : (
          <PrehledDat upgrades={filteredUpgrades} />
        )}
      </div>
    </div>
  )
}

function HlavickaUpgradu({
  total,
  projects,
  thisMonth,
}: {
  total: number
  projects: number
  thisMonth: number
}) {
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
          <span className="text-gray-300">Upgrady</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
              Upgrady
            </h1>
            <p className="mt-1 text-sm text-gray-400 leading-snug">
              Přehled plánovaných a realizovaných upgradů.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 sm:flex sm:gap-6 sm:text-right shrink-0">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Celkem
              </dt>
              <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                {total}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Projektů
              </dt>
              <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                {projects}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Tento měsíc
              </dt>
              <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                {thisMonth}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  )
}

function FiltryUpgradu({
  searchTerm,
  onSearchChange,
  selectedProjekt,
  onProjektChange,
  projekty,
  projectLabelByDoklad,
  selectedStav,
  onStavChange,
  dostupneStavy,
  filteredCount,
  totalCount,
}: {
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedProjekt: string
  onProjektChange: (v: string) => void
  projekty: string[]
  projectLabelByDoklad: Map<string, string>
  selectedStav: string
  onStavChange: (v: string) => void
  dostupneStavy: string[]
  filteredCount: number
  totalCount: number
}) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 w-full min-w-0">
          <div className="w-full min-w-0 sm:max-w-md">
            <label
              htmlFor="upgrady-search"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Hledat
            </label>
            <input
              id="upgrady-search"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Název, projekt, řešitel, JIRA klíč…"
              aria-label="Hledat v upgradech"
              className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            />
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="upgrady-projekt"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Projekt
            </label>
            <select
              id="upgrady-projekt"
              value={selectedProjekt}
              onChange={(e) => onProjektChange(e.target.value)}
              aria-label="Filtr podle projektu"
              className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            >
              <option value="">Všechny projekty</option>
              {projekty.map((p) => (
                <option key={p} value={p}>
                  {projectLabelByDoklad.get(p) ?? p}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56">
            <label
              htmlFor="upgrady-stav"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Stav
            </label>
            <select
              id="upgrady-stav"
              value={selectedStav}
              onChange={(e) => onStavChange(e.target.value)}
              aria-label="Filtr podle stavu"
              className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            >
              <option value="vse">Všechny stavy</option>
              {dostupneStavy.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 sm:pb-0.5 sm:text-right shrink-0">
          Zobrazeno <span className="font-medium text-gray-300">{filteredCount}</span> z{' '}
          <span className="font-medium text-gray-300">{totalCount}</span>
        </div>
      </div>
    </div>
  )
}

function PrehledDat({ upgrades }: { upgrades: Upgrade[] }) {
  return (
    <div className="mt-1">
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 min-w-[320px]">
                Upgrade
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0 whitespace-nowrap">
                Verze
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0 whitespace-nowrap">
                Datum od
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0 whitespace-nowrap">
                Datum do
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Řešitel
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0 whitespace-nowrap min-w-[140px]">
                JIRA
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0 whitespace-nowrap">
                Stav
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/70">
            {upgrades.map((u, idx) => (
              <tr
                key={`${u.projekt}-${u.jira_klic}-${idx}`}
                className="transition-colors hover:bg-gray-800/55 hover:[box-shadow:inset_0_0_0_1px_rgba(148,163,184,0.22),_0_1px_8px_rgba(0,0,0,0.22)]"
              >
                <RadekUpgradu upgrade={u} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {upgrades.map((u, idx) => (
          <div
            key={`${u.projekt}-${u.jira_klic}-${idx}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 py-3"
          >
            <RadekUpgraduMobile upgrade={u} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RadekUpgradu({ upgrade }: { upgrade: Upgrade }) {
  const badge = getStavBadgeClasses(upgrade.stav)
  const projektHref = upgrade.projekt ? `/projects/doklad-projektu/${encodeURIComponent(upgrade.projekt)}` : null
  const jiraHref = upgrade.jira_klic
    ? `https://your-jira-instance.com/browse/${encodeURIComponent(upgrade.jira_klic)}`
    : null

  return (
    <>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col gap-0.5 min-w-0 leading-snug">
          <div className="text-base font-semibold text-white leading-tight">
            {upgrade.nazev || '—'}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-gray-400">
            {upgrade.projekt ? (
              projektHref ? (
                <Link href={projektHref} className={linkBase}>
                  <span className="font-mono text-xs text-gray-400 group-hover:text-gray-200">
                    {upgrade.projekt}
                  </span>
                </Link>
              ) : (
                <span className="font-mono text-xs text-gray-400">{upgrade.projekt}</span>
              )
            ) : (
              <span className="text-gray-600">—</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="font-mono text-[11px] text-gray-300">{upgrade.verze || '—'}</span>
      </td>

      <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-200 tabular-nums">
        {formatDate(upgrade.datum_od)}
      </td>

      <td className="px-4 py-3 align-top whitespace-nowrap text-sm text-gray-200 tabular-nums">
        {upgrade.datum_do && upgrade.datum_do !== upgrade.datum_od ? (
          formatDate(upgrade.datum_do)
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </td>

      <td className="px-4 py-3 align-top text-sm text-gray-300">
        <span className="truncate block max-w-[220px]" title={upgrade.resitel || ''}>
          {upgrade.resitel || '—'}
        </span>
      </td>

      <td className="px-4 py-3 align-top whitespace-nowrap">
        {jiraHref ? (
          <a
            href={jiraHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkBase} -ml-1`}
          >
            <span className="inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/40 px-2 py-1 text-[11px] font-medium font-mono leading-tight">
              <span className={spanLinkMuted}>{upgrade.jira_klic}</span>
            </span>
          </a>
        ) : (
          <span className="font-mono text-[11px] text-gray-500">{upgrade.jira_klic || '—'}</span>
        )}
      </td>

      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className={badge.wrap}>
          <span className={badge.text}>{upgrade.stav || '—'}</span>
        </span>
      </td>
    </>
  )
}

function RadekUpgraduMobile({ upgrade }: { upgrade: Upgrade }) {
  const badge = getStavBadgeClasses(upgrade.stav)
  const projektHref = upgrade.projekt ? `/projects/doklad-projektu/${encodeURIComponent(upgrade.projekt)}` : null
  const jiraHref = upgrade.jira_klic
    ? `https://your-jira-instance.com/browse/${encodeURIComponent(upgrade.jira_klic)}`
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-white leading-tight">
            {upgrade.nazev || '—'}
          </div>
          <div className="mt-0.5 text-sm text-gray-400">
            {upgrade.projekt ? (
              projektHref ? (
                <Link href={projektHref} className={linkBase}>
                  <span className="font-mono text-xs text-gray-400 group-hover:text-gray-200">
                    {upgrade.projekt}
                  </span>
                </Link>
              ) : (
                <span className="font-mono text-xs text-gray-400">{upgrade.projekt}</span>
              )
            ) : (
              <span className="text-xs text-gray-600">—</span>
            )}
          </div>
        </div>
        <span className={badge.wrap}>
          <span className={badge.text}>{upgrade.stav || '—'}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <span className="text-gray-500">Verze</span>
        <span className="font-mono text-[11px] text-gray-300">{upgrade.verze || '—'}</span>
        <span className="text-gray-500">Od</span>
        <span className="text-gray-200 tabular-nums">{formatDate(upgrade.datum_od)}</span>
        <span className="text-gray-500">Do</span>
        <span className="text-gray-200 tabular-nums">
          {upgrade.datum_do && upgrade.datum_do !== upgrade.datum_od ? (
            formatDate(upgrade.datum_do)
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </span>
        <span className="text-gray-500">Řešitel</span>
        <span className="text-gray-300">{upgrade.resitel || '—'}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 items-center">
        {jiraHref ? (
          <a
            href={jiraHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
          >
            <span className={spanLink}>Otevřít JIRA</span>
          </a>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400 leading-snug">{message}</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-700/40 bg-amber-900/15 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-amber-100/90">Chyba načtení</h3>
          <p className="mt-1 text-sm text-amber-100/80 leading-snug">
            Nepodařilo se načíst upgrady. Zkuste to prosím později.
          </p>
          <p className="mt-2 text-[11px] text-amber-200/60 font-mono break-all">{message}</p>
        </div>
        <a
          href="http://itmsql01:44612/web/upgrades"
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkBase} inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30 transition-colors text-xs shrink-0`}
        >
          <span className="text-amber-100/90">Otevřít server</span>
        </a>
      </div>
    </div>
  )
}


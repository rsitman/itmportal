'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PatchModule } from '@/types/project'

const linkBase =
  'group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded'
const spanSecondary =
  'text-gray-300 transition-colors duration-150 group-hover:text-gray-100'

type PrehledPatchModuluProps = {
  patchModules: PatchModule[]
  projekt: string
  firma: string
  missingParams?: boolean
}

export default function PrehledPatchModulu({
  patchModules,
  projekt,
  firma,
  missingParams = false,
}: PrehledPatchModuluProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStav, setFilterStav] = useState<'vse' | 'ok' | 'vyzaduje'>('vse')

  const filteredModules = useMemo(() => {
    let list = patchModules
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          (m.nazev && m.nazev.toLowerCase().includes(q)) ||
          (m.id_modulu && m.id_modulu.toLowerCase().includes(q)) ||
          (m.verze && m.verze.toLowerCase().includes(q))
      )
    }
    if (filterStav === 'ok') {
      list = list.filter((m) => isModuleOk(m))
    } else if (filterStav === 'vyzaduje') {
      list = list.filter((m) => !isModuleOk(m))
    }
    return list
  }, [patchModules, searchTerm, filterStav])

  const totalCount = patchModules.length
  const okCount = useMemo(() => patchModules.filter(isModuleOk).length, [patchModules])
  const vyzadujeCount = totalCount - okCount

  if (missingParams) {
    return (
      <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
        <div className="border-b border-gray-700/50 pb-3 mb-3">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Patch moduly
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 leading-snug">
            Stránka vyžaduje parametry projekt a firma v URL.
          </p>
        </div>
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-4 py-3 text-amber-100/90">
          <p className="text-sm leading-snug">
            Chybí parametry <strong>projekt</strong> a <strong>firma</strong>. Použijte odkaz z
            přehledu patchování nebo evidence projektů.
          </p>
        </div>
        <div className="mt-3">
          <Link
            href="/plan_patchovani"
            className={`${linkBase} inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 transition-colors text-xs`}
          >
            <span className={spanSecondary}>← Zpět na přehled patchování</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <HlavickaPatchModulu
        projekt={projekt}
        firma={firma}
        totalCount={totalCount}
        okCount={okCount}
        vyzadujeCount={vyzadujeCount}
      />

      <div className="mt-3 flex flex-col gap-2.5">
        <FiltryPatchModulu
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStav={filterStav}
          onFilterStavChange={setFilterStav}
          filteredCount={filteredModules.length}
          totalCount={totalCount}
        />

        {patchModules.length === 0 ? (
          <div className="mt-2 rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-5 text-center">
            <p className="text-sm text-gray-400 leading-snug">
              Pro tento projekt a firmu nebyly nalezeny žádné patch moduly.
            </p>
            <div className="mt-3">
              <Link
                href="/plan_patchovani"
                className={`${linkBase} text-xs`}
              >
                <span className={spanSecondary}>← Zpět na přehled patchování</span>
              </Link>
            </div>
          </div>
        ) : (
          <TabulkaPatchModulu modules={filteredModules} />
        )}
      </div>
    </div>
  )
}

function isModuleOk(m: PatchModule): boolean {
  const standardOk =
    m.posl_patch_40 === m.max_patch_40 || m.posl_patch_40 === '000' || m.max_patch_40 === '000'
  const statOk =
    m.posl_patch_36 === m.max_patch_36 || m.posl_patch_36 === '000' || m.max_patch_36 === '000'
  return standardOk && statOk
}

// --- Header ---
type HlavickaPatchModuluProps = {
  projekt: string
  firma: string
  totalCount: number
  okCount: number
  vyzadujeCount: number
}

function HlavickaPatchModulu({
  projekt,
  firma,
  totalCount,
  okCount,
  vyzadujeCount,
}: HlavickaPatchModuluProps) {
  return (
    <header className="border-b border-gray-700/50 pb-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Patch moduly
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 leading-snug">
            <span className="font-mono text-gray-400">{projekt}</span>
            <span className="text-gray-600 mx-1">·</span>
            <span className="font-mono text-gray-400">{firma}</span>
          </p>
          <p className="mt-0.5 text-[10px] text-gray-600 leading-snug">
            Standard (40) · Stát (36) · ✓ aktuální · ⚠ vyžaduje aktualizaci
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:gap-x-6 sm:shrink-0 mt-1 sm:mt-0">
          <dl className="flex gap-x-4 sm:gap-x-6 text-right">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Celkem
              </dt>
              <dd className="text-xs font-semibold text-white tabular-nums leading-tight">
                {totalCount}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                OK
              </dt>
              <dd className="text-xs font-semibold text-gray-300 tabular-nums leading-tight">
                {okCount}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Vyžaduje
              </dt>
              <dd className="text-xs font-semibold text-gray-300 tabular-nums leading-tight">
                {vyzadujeCount}
              </dd>
            </div>
          </dl>
          <Link
            href="/plan_patchovani"
            className={`${linkBase} inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 transition-colors text-xs shrink-0`}
          >
            <span className={spanSecondary}>← Zpět</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

// --- Toolbar ---
type FiltryPatchModuluProps = {
  searchTerm: string
  onSearchChange: (v: string) => void
  filterStav: 'vse' | 'ok' | 'vyzaduje'
  onFilterStavChange: (v: 'vse' | 'ok' | 'vyzaduje') => void
  filteredCount: number
  totalCount: number
}

function FiltryPatchModulu({
  searchTerm,
  onSearchChange,
  filterStav,
  onFilterStavChange,
  filteredCount,
  totalCount,
}: FiltryPatchModuluProps) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2 md:px-4 md:py-2.5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          <div className="w-full min-w-0 sm:max-w-sm flex items-center gap-2">
            <label
              htmlFor="patch-modules-search"
              className="shrink-0 text-[11px] font-medium text-gray-500"
            >
              Hledat
            </label>
            <input
              id="patch-modules-search"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Název, ID, verze…"
              aria-label="Hledat v patch modulech"
              className="flex-1 min-w-0 pl-2.5 pr-2.5 py-1.5 rounded-md bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="patch-modules-stav"
              className="text-[11px] font-medium text-gray-500 shrink-0"
            >
              Stav
            </label>
            <select
              id="patch-modules-stav"
              value={filterStav}
              onChange={(e) =>
                onFilterStavChange(e.target.value as 'vse' | 'ok' | 'vyzaduje')
              }
              aria-label="Filtr podle stavu"
              className="pl-2 pr-2 py-1.5 rounded-md bg-gray-800/80 border border-gray-600/60 text-xs text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-green-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900 w-28"
            >
              <option value="vse">Vše</option>
              <option value="ok">✓ OK</option>
              <option value="vyzaduje">⚠ Vyžaduje</option>
            </select>
          </div>
        </div>
        <div className="text-[11px] text-gray-500 shrink-0 sm:text-right">
          Zobrazeno <span className="font-medium text-gray-400">{filteredCount}</span> z{' '}
          <span className="font-medium text-gray-400">{totalCount}</span>
        </div>
      </div>
    </div>
  )
}

// --- Table ---
function TabulkaPatchModulu({ modules }: { modules: PatchModule[] }) {
  if (modules.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-5 text-center">
        <p className="text-sm text-gray-400 leading-snug">
          Žádné moduly neodpovídají filtrům.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/60">
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0">
              ID modulu
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 min-w-[140px]">
              Název
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0">
              Verze
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0">
              Stát
            </th>
            <th
              colSpan={2}
              className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-800/70"
            >
              Standard
            </th>
            <th
              colSpan={2}
              className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-800/70"
            >
              Stát (leg.)
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 w-0">
              Stav
            </th>
          </tr>
          <tr className="border-b border-gray-700 bg-gray-800/40">
            <th className="px-3 py-1" />
            <th className="px-3 py-1" />
            <th className="px-3 py-1" />
            <th className="px-3 py-1" />
            <th className="px-3 py-1 text-[10px] font-normal text-gray-500 text-right">
              nainst.
            </th>
            <th className="px-3 py-1 text-[10px] font-normal text-gray-500 text-right">
              dostup.
            </th>
            <th className="px-3 py-1 text-[10px] font-normal text-gray-500 text-right">
              nainst.
            </th>
            <th className="px-3 py-1 text-[10px] font-normal text-gray-500 text-right">
              dostup.
            </th>
            <th className="px-3 py-1" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/60">
          {modules.map((module, index) => (
            <tr
              key={`${module.id_modulu}-${index}`}
              className="transition-colors hover:bg-gray-800/50"
            >
              <RadekPatchModulu module={module} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RadekPatchModulu({ module }: { module: PatchModule }) {
  const standardNeedsUpdate =
    module.posl_patch_40 !== module.max_patch_40 &&
    module.posl_patch_40 !== '000' &&
    module.max_patch_40 !== '000'
  const statNeedsUpdate =
    module.posl_patch_36 !== module.max_patch_36 &&
    module.posl_patch_36 !== '000' &&
    module.max_patch_36 !== '000'

  return (
    <>
      <td className="px-3 py-2 align-middle whitespace-nowrap">
        <span className="font-mono text-[11px] text-gray-500">{module.id_modulu || '—'}</span>
      </td>
      <td className="px-3 py-2 align-middle min-w-0">
        <span className="text-sm font-semibold text-white leading-snug block truncate max-w-[200px]">
          {module.nazev || '—'}
        </span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap">
        <span className="font-mono text-[11px] text-gray-400">
          {module.verze || '—'}
        </span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap">
        <span className="text-[11px] text-gray-400">
          {module.stat || '—'}
        </span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap text-right">
        <span
          className={
            standardNeedsUpdate
              ? 'font-mono text-sm font-medium text-amber-200/90 bg-amber-900/30 rounded px-1.5 py-0.5 tabular-nums'
              : 'font-mono text-sm text-gray-200 tabular-nums'
          }
        >
          {module.posl_patch_40}
        </span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap text-right">
        <span className="font-mono text-sm text-gray-400 tabular-nums">{module.max_patch_40}</span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap text-right">
        <span
          className={
            statNeedsUpdate
              ? 'font-mono text-sm font-medium text-amber-200/90 bg-amber-900/30 rounded px-1.5 py-0.5 tabular-nums'
              : 'font-mono text-sm text-gray-200 tabular-nums'
          }
        >
          {module.posl_patch_36}
        </span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap text-right">
        <span className="font-mono text-sm text-gray-400 tabular-nums">{module.max_patch_36}</span>
      </td>
      <td className="px-3 py-2 align-middle whitespace-nowrap">
        <StavovyBadge module={module} />
      </td>
    </>
  )
}

function StavovyBadge({ module }: { module: PatchModule }) {
  const ok = isModuleOk(module)
  if (ok) {
    return (
      <span className="inline-flex items-center rounded border border-emerald-700/40 bg-emerald-900/25 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200/90 leading-tight">
        ✓ OK
      </span>
    )
  }
  const problems: string[] = []
  const standardOk =
    module.posl_patch_40 === module.max_patch_40 ||
    module.posl_patch_40 === '000' ||
    module.max_patch_40 === '000'
  const statOk =
    module.posl_patch_36 === module.max_patch_36 ||
    module.posl_patch_36 === '000' ||
    module.max_patch_36 === '000'
  if (!standardOk && module.posl_patch_40 !== '000' && module.max_patch_40 !== '000') {
    problems.push('Standard')
  }
  if (!statOk && module.posl_patch_36 !== '000' && module.max_patch_36 !== '000') {
    problems.push('Stát')
  }
  return (
    <span className="inline-flex items-center rounded border border-amber-700/40 bg-amber-900/25 px-1.5 py-0.5 text-[10px] font-medium text-amber-200/90 leading-tight">
      ⚠ {problems.join('+')}
    </span>
  )
}

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
        <div className="border-b border-gray-700/50 pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Patch moduly
          </h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            Stránka vyžaduje parametry projekt a firma v URL.
          </p>
        </div>
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 px-5 py-4 text-amber-100">
          <p className="text-sm leading-snug">
            Chybí parametry <strong>projekt</strong> a <strong>firma</strong>. Použijte odkaz z
            přehledu patchování nebo evidence projektů.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href="/plan_patchovani"
            className={`${linkBase} inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 transition-colors`}
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

      <div className="mt-4 flex flex-col gap-3">
        <FiltryPatchModulu
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStav={filterStav}
          onFilterStavChange={setFilterStav}
          filteredCount={filteredModules.length}
          totalCount={totalCount}
        />

        {patchModules.length === 0 ? (
          <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
            <p className="text-base text-gray-400 leading-snug">
              Pro tento projekt a firmu nebyly nalezeny žádné patch moduly.
            </p>
            <div className="mt-4">
              <Link
                href="/plan_patchovani"
                className={linkBase}
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
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Patch moduly
          </h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            Projekt <span className="font-mono text-gray-300">{projekt}</span>
            {' · '}
            Firma <span className="font-mono text-gray-300">{firma}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 leading-snug">
            Standard = funkční patche (40) · Stát = legislativní (36) · ✓ aktuální · ⚠ vyžaduje
            aktualizaci
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 shrink-0">
          <dl className="grid grid-cols-3 gap-x-4 gap-y-0.5 sm:flex sm:gap-6 sm:text-right">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Celkem
              </dt>
              <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">{totalCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                OK
              </dt>
              <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">{okCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Vyžaduje
              </dt>
              <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                {vyzadujeCount}
              </dd>
            </div>
          </dl>
          <Link
            href="/plan_patchovani"
            className={`${linkBase} inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 transition-colors shrink-0`}
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
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 flex-wrap">
          <div className="w-full min-w-0 sm:max-w-md">
            <label
              htmlFor="patch-modules-search"
              className="block text-xs font-medium text-gray-400 mb-0.5"
            >
              Hledat
            </label>
            <input
              id="patch-modules-search"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Název, ID modulu, verze…"
              aria-label="Hledat v patch modulech"
              className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
            />
          </div>
          <div className="w-full min-w-0 sm:w-40">
            <label
              htmlFor="patch-modules-stav"
              className="block text-xs font-medium text-gray-400 mb-0.5"
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
              className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <option value="vse">Vše</option>
              <option value="ok">✓ OK</option>
              <option value="vyzaduje">⚠ Vyžaduje</option>
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

// --- Table ---
function TabulkaPatchModulu({ modules }: { modules: PatchModule[] }) {
  if (modules.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
        <p className="text-base text-gray-400 leading-snug">
          Žádné moduly neodpovídají filtrům.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/50">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              ID modulu
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Název
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Verze
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Stát
            </th>
            <th
              colSpan={2}
              className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 border-l border-gray-700/70"
            >
              Standard
            </th>
            <th
              colSpan={2}
              className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 border-l border-gray-700/70"
            >
              Stát (leg.)
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Stav
            </th>
          </tr>
          <tr className="border-b border-gray-700/80 bg-gray-800/40 text-[10px] text-gray-500">
            <th className="px-4 py-1.5" />
            <th className="px-4 py-1.5" />
            <th className="px-4 py-1.5" />
            <th className="px-4 py-1.5" />
            <th className="px-4 py-1.5 font-normal">nainst.</th>
            <th className="px-4 py-1.5 font-normal">dostup.</th>
            <th className="px-4 py-1.5 font-normal border-l border-gray-700/70">nainst.</th>
            <th className="px-4 py-1.5 font-normal">dostup.</th>
            <th className="px-4 py-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/70">
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
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="font-mono text-sm text-gray-400">{module.id_modulu || '—'}</span>
      </td>
      <td className="px-4 py-3 align-top min-w-0">
        <span className="text-sm font-semibold text-white leading-snug block truncate max-w-[200px]">
          {module.nazev || '—'}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="inline-flex items-center rounded-md border border-gray-600/60 bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-gray-200">
          {module.verze || '—'}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="inline-flex items-center rounded-md border border-gray-600/60 bg-gray-800/60 px-2 py-0.5 text-xs font-medium text-gray-300">
          {module.stat || '—'}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap border-l border-gray-700/70">
        <span
          className={
            standardNeedsUpdate
              ? 'font-mono text-xs font-semibold text-amber-200 bg-amber-900/50 border border-amber-600/50 rounded px-1.5 py-0.5'
              : 'font-mono text-sm text-gray-300'
          }
        >
          {module.posl_patch_40}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="font-mono text-sm text-gray-300">{module.max_patch_40}</span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap border-l border-gray-700/70">
        <span
          className={
            statNeedsUpdate
              ? 'font-mono text-xs font-semibold text-amber-200 bg-amber-900/50 border border-amber-600/50 rounded px-1.5 py-0.5'
              : 'font-mono text-sm text-gray-300'
          }
        >
          {module.posl_patch_36}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className="font-mono text-sm text-gray-300">{module.max_patch_36}</span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <StavovyBadge module={module} />
      </td>
    </>
  )
}

function StavovyBadge({ module }: { module: PatchModule }) {
  const ok = isModuleOk(module)
  if (ok) {
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-700/50 bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-200 leading-snug">
        ✓ Vše OK
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
    <span className="inline-flex items-center rounded-md border border-amber-700/50 bg-amber-900/30 px-2 py-0.5 text-[11px] font-medium text-amber-200 leading-snug">
      ⚠ {problems.join(' + ')}
    </span>
  )
}

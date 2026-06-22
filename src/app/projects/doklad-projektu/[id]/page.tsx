import { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProjectLinksSection from '@/components/projects/ProjectLinksSection'

interface DetailProjektuPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    returnTo?: string
  }>
}

export const metadata: Metadata = {
  title: 'Detail projektu',
  description: 'Landing detail projektu a navazující oblasti',
}

function safeInternalHref(value: string | undefined | null): string | null {
  const v = (value ?? '').trim()
  if (!v) return null
  // Povolit jen interní relativní cesty, aby nešlo injektovat externí URL.
  if (!v.startsWith('/')) return null
  if (v.startsWith('//')) return null
  return v
}

export default async function DetailProjektuPage({ params, searchParams }: DetailProjektuPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dokladProjektu = resolvedParams.id
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const returnTo = safeInternalHref(resolvedSearchParams?.returnTo)

  const detailPath = `/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}`
  const subpageReturnTo = encodeURIComponent(detailPath + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''))

  let nazevProjektu: string | null = null
  try {
    const res = await fetch('http://itmsql01:44612/web/projects', { cache: 'no-store' })
    if (res.ok) {
      const raw = await res.json()
      const list = Array.isArray(raw) ? raw : []
      const row = list.find((p: { projekt?: string }) => (p.projekt || '') === dokladProjektu)
      if (row?.nazev) nazevProjektu = String(row.nazev).trim() || null
    }
  } catch {
    // bez názvu zůstane H1 neutrální
  }

  const hlavniNazev = nazevProjektu || 'Detail projektu'

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-6 space-y-6">
        <nav className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={returnTo ?? '/evidence-projektu'}
            className="group inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
              Evidence projektů
            </span>
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300" title={dokladProjektu}>
            Projekt: {nazevProjektu ? nazevProjektu : dokladProjektu}
          </span>
        </nav>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{hlavniNazev}</h1>
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">Doklad</span>{' '}
              <span className="font-mono text-gray-300">{dokladProjektu}</span>
            </div>
          </div>
          <Link
            href={returnTo ?? '/evidence-projektu'}
            className="px-4 py-2 rounded border border-gray-600 bg-gray-800/80 !text-gray-300 hover:!text-gray-100 hover:bg-gray-700 hover:border-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            ← Zpět na přehled
          </Link>
        </div>

        <div className="card-professional p-6">
          <h2 className="text-base font-semibold text-white mb-1">Rychlé odkazy</h2>
          <p className="text-sm text-gray-300">
            V této stránce je pouze navigační rozcestník. Detailní informace jsou v jednotlivých sekcích.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href={`${detailPath}/team?returnTo=${subpageReturnTo}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Tým</div>
            <div className="text-sm text-gray-300">Členové týmu, role a kontakty</div>
          </Link>

          <Link
            href={`${detailPath}/extcomps?returnTo=${subpageReturnTo}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Externí komponenty</div>
            <div className="text-sm text-gray-300">Komponenty třetích stran a kontakty</div>
          </Link>

          <Link
            href="/plan_patchovani"
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Patchování</div>
            <div className="text-sm text-gray-300">Přehled patchování (bez filtru)</div>
          </Link>

          <Link
            href={`/upgrades?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Upgrady</div>
            <div className="text-sm text-gray-300">Plánované a provedené upgrady</div>
          </Link>

          <Link
            href={`${detailPath}/jpp?returnTo=${subpageReturnTo}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Pravidelné požadavky</div>
            <div className="text-sm text-gray-300">Pravidelné požadavky přiřazené k projektu</div>
          </Link>

          <Link
            href={`/databases?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">Stav produkčních DB</div>
            <div className="text-sm text-gray-300">Aktuální stav a metriky databází</div>
          </Link>

          <Link
            href={`/hwsw-config?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <div className="text-white font-semibold mb-1">HW/SW konfigurace</div>
            <div className="text-sm text-gray-300">Konfigurace prostředí a komponent</div>
          </Link>
        </div>

        <div className="card-professional p-6">
          <h2 className="text-base font-semibold text-white mb-3">Související odkazy</h2>
          <ProjectLinksSection dokladProjektu={dokladProjektu} />
        </div>
      </div>
    </div>
  )
}


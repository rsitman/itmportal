import { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface DetailProjektuPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Detail projektu',
  description: 'Landing detail projektu a navazující oblasti',
}

export default async function DetailProjektuPage({ params }: DetailProjektuPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dokladProjektu = resolvedParams.id

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="mb-6 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Detail projektu</h1>
        <p className="text-gray-300">
          Doklad projektu:{' '}
          <span className="font-mono text-white font-semibold">{dokladProjektu}</span>
        </p>
      </div>

      <div className="px-6 space-y-6">
        <div className="card-professional p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Navigace</h2>
          <p className="text-sm text-gray-300">
            Základní landing pro rychlý přístup do navazujících oblastí. Detailní data jsou v jednotlivých sekcích.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href={`/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/team`}
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">Tým</div>
            <div className="text-sm text-gray-300">Členové týmu, role a kontakty</div>
          </Link>

          <Link
            href={`/projects/doklad-projektu/${encodeURIComponent(dokladProjektu)}/extcomps`}
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">Externí komponenty</div>
            <div className="text-sm text-gray-300">Komponenty třetích stran a kontakty</div>
          </Link>

          <Link
            href="/plan_patchovani"
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">Patchování</div>
            <div className="text-sm text-gray-300">Přehled patchování (bez filtru)</div>
          </Link>

          <Link
            href={`/upgrades?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">Upgrady</div>
            <div className="text-sm text-gray-300">Plánované a provedené upgrady</div>
          </Link>

          <Link
            href={`/databases?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">Stav produkčních DB</div>
            <div className="text-sm text-gray-300">Aktuální stav a metriky databází</div>
          </Link>

          <Link
            href={`/hwsw-config?projekt=${encodeURIComponent(dokladProjektu)}`}
            className="card-professional p-6 hover:shadow-strong transition-all"
          >
            <div className="text-white font-semibold mb-1">HW/SW konfigurace</div>
            <div className="text-sm text-gray-300">Konfigurace prostředí a komponent</div>
          </Link>
        </div>

        <div className="flex justify-between">
          <Link
            href="/evidence-projektu"
            className="px-4 py-2 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors"
          >
            ← Zpět na přehled projektů
          </Link>
        </div>
      </div>
    </div>
  )
}


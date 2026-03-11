import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Upgrade } from '@/types/upgrade'
import PrehledUpgradu from '@/components/upgrades/PrehledUpgradu'
import { fetchUpgradesFromErp } from '@/lib/upgrades-server'

export const metadata: Metadata = {
  title: 'Upgrady',
  description: 'Přehled plánovaných a realizovaných upgradů',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function mapToUpgradeArray(input: unknown): Upgrade[] {
  if (!Array.isArray(input)) return []

  const toStringSafe = (v: unknown): string => (typeof v === 'string' ? v : '')

  return input
    .filter((row) => isRecord(row))
    .map((row) => ({
      projekt: toStringSafe(row.projekt),
      nazev: toStringSafe(row.nazev),
      verze: toStringSafe(row.verze),
      datum_od: toStringSafe(row.datum_od),
      datum_do: toStringSafe(row.datum_do),
      resitel: toStringSafe(row.resitel),
      jira_klic: toStringSafe(row.jira_klic),
      stav: toStringSafe(row.stav),
    }))
    .filter((u) => u.projekt && u.nazev)
}

export default async function UpgradesPage({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const params = await searchParams
  const initialProjekt = params.projekt?.trim() || ''

  let upgrades: Upgrade[] = []
  let errorMessage: string | null = null

  const result = await fetchUpgradesFromErp()
  if (result.ok) {
    upgrades = mapToUpgradeArray(result.data)
  } else {
    errorMessage = result.error
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <PrehledUpgradu
          initialUpgrades={upgrades}
          initialProjekt={initialProjekt}
          serverError={errorMessage}
        />
      </div>
    </div>
  )
}

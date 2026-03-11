import { Metadata } from 'next'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Upgrade } from '@/types/upgrade'
import PrehledUpgradu from '@/components/upgrades/PrehledUpgradu'

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

function getBaseUrlFromHeaders(): string {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
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

  try {
    const baseUrl = getBaseUrlFromHeaders()
    const response = await fetch(new URL('/api/upgrades-proxy', baseUrl), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch upgrades: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as unknown
    upgrades = mapToUpgradeArray(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errorMessage = message
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

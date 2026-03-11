import { Metadata } from 'next'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Database } from '@/types/database'
import AktualniStavDbClient from '@/components/databases/AktualniStavDbClient'

export const metadata: Metadata = {
  title: 'Aktuální stav databází',
  description: 'Přehled stavu a využití databází v IS KARAT',
}

type DatabasesApiResponse =
  | {
      success: true
      data: { databases: Database[]; totalDatabases: number; lastUpdated: string }
    }
  | { success: false; error?: string; details?: string; isNetworkError?: boolean }

async function getBaseUrlFromHeaders(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

export default async function AktualniStavDbPage({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const params = await searchParams
  const initialProjekt = params.projekt?.trim() ?? ''

  let databases: Database[] = []
  let lastUpdated: string | null = null
  let errorMessage: string | null = null

  try {
    const baseUrl = await getBaseUrlFromHeaders()
    const response = await fetch(new URL('/api/databases', baseUrl), {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })

    const json = (await response.json()) as DatabasesApiResponse

    if (!response.ok) {
      throw new Error(`Failed to fetch databases: ${response.status} ${response.statusText}`)
    }

    if (!json.success) {
      throw new Error(json.error || json.details || 'Failed to fetch databases')
    }

    databases = json.data.databases ?? []
    lastUpdated = json.data.lastUpdated ?? null
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <AktualniStavDbClient
          initialDatabases={databases}
          initialProjekt={initialProjekt}
          lastUpdated={lastUpdated}
          serverError={errorMessage}
        />
      </div>
    </div>
  )
}

import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Database } from '@/types/database'
import AktualniStavDbClient from '@/components/databases/AktualniStavDbClient'
import { fetchDatabasesFromErp } from '@/lib/databases-server'

export const metadata: Metadata = {
  title: 'Aktuální stav databází',
  description: 'Přehled stavu a využití databází v IS KARAT',
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

  const result = await fetchDatabasesFromErp()
  if (result.ok) {
    databases = result.databases
    lastUpdated = new Date().toISOString()
  } else {
    errorMessage = result.error
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

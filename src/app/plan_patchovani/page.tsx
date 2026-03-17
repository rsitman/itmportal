import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { fetchKaratProjectsDirect } from '@/lib/karat-service'
import PrehledPatchovani from '@/components/plan-patchovani/PrehledPatchovani'

export const metadata: Metadata = {
  title: 'Přehled patchování',
  description: 'Aktuální stav patchování a plánované termíny projektů',
}

export default async function PlanPatchovaniPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; projekt?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const projects = await fetchKaratProjectsDirect()
  const resolvedSearchParams = await searchParams
  const initialQuery = resolvedSearchParams.q ?? ''
  const initialProjekt = resolvedSearchParams.projekt?.trim() ?? ''

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <PrehledPatchovani projects={projects} initialQuery={initialQuery} initialProjekt={initialProjekt} />
      </div>
    </div>
  )
}

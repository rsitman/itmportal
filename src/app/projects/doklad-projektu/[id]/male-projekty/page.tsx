import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import SmallProjectsClient from '@/components/projects/SmallProjectsClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Malé projekty',
  description: 'Seznam malých projektů daného projektu',
}

export default async function ProjectSmallProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    q?: string
    resitel?: string
    zadavatel?: string
    stav?: string
  }>
}) {
  const configuredSession = await getServerSession(authOptions)
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const projectCode = resolvedParams.id

  if (!configuredSession) {
    redirect('/login')
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <SmallProjectsClient
        endpoint={`/api/projects/${projectCode}/small-projects`}
        title={`Malé projekty projektu: ${projectCode}`}
        description="Seznam malých projektů přiřazených k danému projektu"
        emptyMessage="Tento projekt nemá žádné malé projekty."
        showProjectColumn={false}
        initialQuery={resolvedSearchParams.q ?? ''}
        initialResitel={resolvedSearchParams.resitel?.trim() ?? ''}
        initialZadavatel={resolvedSearchParams.zadavatel?.trim() ?? ''}
        initialStav={resolvedSearchParams.stav?.trim() ?? ''}
      />
    </div>
  )
}

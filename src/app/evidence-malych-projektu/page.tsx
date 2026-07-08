import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import SmallProjectsClient from '@/components/projects/SmallProjectsClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Evidence malých projektů',
  description: 'Seznam malých projektů z IS KARAT',
}

export default async function SmallProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    projekt?: string
    resitel?: string
    zadavatel?: string
    stav?: string
  }>
}) {
  const configuredSession = await getServerSession(authOptions)

  if (!configuredSession) {
    redirect('/login')
  }

  const params = await searchParams

  return (
    <div className="w-full py-10 bg-transparent">
      <SmallProjectsClient
        endpoint="/api/small-projects"
        title="Evidence malých projektů"
        description="Seznam malých projektů a jejich podúkolů z IS KARAT"
        emptyMessage="Nebyly nalezeny žádné malé projekty."
        showPartnerColumn
        initialQuery={params.q ?? ''}
        initialProjekt={params.projekt?.trim() ?? ''}
        initialResitel={params.resitel?.trim() ?? ''}
        initialZadavatel={params.zadavatel?.trim() ?? ''}
        initialStav={params.stav?.trim() ?? ''}
      />
    </div>
  )
}

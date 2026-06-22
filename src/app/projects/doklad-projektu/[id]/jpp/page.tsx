import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import RegularRequestsClient from '@/components/projects/RegularRequestsClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Pravidelné požadavky projektu',
  description: 'Seznam pravidelných požadavků daného projektu',
}

export default async function ProjectRegularRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const configuredSession = await getServerSession(authOptions)
  const resolvedParams = await params
  const projectCode = resolvedParams.id

  if (!configuredSession) {
    redirect('/login')
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <RegularRequestsClient
        endpoint={`/api/projects/${projectCode}/jpp`}
        title={`Pravidelné požadavky projektu: ${projectCode}`}
        description="Seznam pravidelných požadavků přiřazených k danému projektu"
        emptyMessage="Tento projekt nemá žádné pravidelné požadavky."
        showProjectColumn={false}
      />
    </div>
  )
}

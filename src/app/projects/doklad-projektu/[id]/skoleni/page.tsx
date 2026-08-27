import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import SkoleniClient from '@/components/projects/SkoleniClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Školení projektu',
  description: 'Seznam školení daného projektu',
}

export default async function ProjectSkoleniPage({
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
      <SkoleniClient
        endpoint={`/api/projects/${encodeURIComponent(projectCode)}/skoleni`}
        title={`Školení projektu: ${projectCode}`}
        description="Seznam školení přiřazených k danému projektu"
        emptyMessage="Tento projekt nemá žádná školení."
        showDokladColumn={false}
      />
    </div>
  )
}

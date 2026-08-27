import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import SkoleniClient from '@/components/projects/SkoleniClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Evidence školení',
  description: 'Seznam školení přiřazených k dokladům projektů',
}

export default async function SkoleniPage({
  searchParams,
}: {
  searchParams: Promise<{
    doklad?: string
  }>
}) {
  const configuredSession = await getServerSession(authOptions)

  if (!configuredSession) {
    redirect('/login')
  }

  const params = await searchParams

  return (
    <div className="w-full py-10 bg-transparent">
      <SkoleniClient
        endpoint="/api/skoleni"
        title="Evidence školení"
        description="Seznam školení přiřazených k dokladům projektů"
        emptyMessage="Nebyly nalezeny žádné záznamy školení."
        initialDoklad={params.doklad?.trim() ?? ''}
      />
    </div>
  )
}

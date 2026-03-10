import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import ExterniKomponentyPage from '@/components/projects/ExterniKomponentyPage'

interface ExtcompsPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Externí komponenty projektu',
  description: 'Přehled externích softwarových komponent třetích stran a kontaktů',
}

export default async function ExtcompsPage({ params }: ExtcompsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dokladProjektu = resolvedParams.id

  return <ExterniKomponentyPage dokladProjektu={dokladProjektu} />
}

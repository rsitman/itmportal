import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import TymPage from '@/components/projects/TymPage'

interface ProjectTeamPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Tým projektu',
  description: 'Přehled členů týmu projektu, rolí a kontaktních informací',
}

export default async function ProjectTeamPage({ params }: ProjectTeamPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dokladProjektu = resolvedParams.id

  return <TymPage dokladProjektu={dokladProjektu} />
}


import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import TymPage from '@/components/projects/TymPage'

interface ProjectTeamPageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    returnTo?: string
  }>
}

export const metadata: Metadata = {
  title: 'Tým projektu',
  description: 'Přehled členů týmu projektu, rolí a kontaktních informací',
}

export default async function ProjectTeamPage({ params, searchParams }: ProjectTeamPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const dokladProjektu = resolvedParams.id
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const returnTo = resolvedSearchParams?.returnTo ?? null

  return <TymPage dokladProjektu={dokladProjektu} returnTo={returnTo} />
}


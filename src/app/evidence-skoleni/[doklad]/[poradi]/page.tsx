import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import SkoleniDetailClient from '@/components/projects/SkoleniDetailClient'

export const metadata: Metadata = {
  title: 'Detail školení',
  description: 'Detail školení a seznam účastníků',
}

export default async function SkoleniDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ doklad: string; poradi: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const doklad = decodeURIComponent(resolvedParams.doklad)
  const poradiSkol = Number(resolvedParams.poradi)

  if (!doklad || !Number.isFinite(poradiSkol)) {
    redirect('/evidence-skoleni')
  }

  return (
    <SkoleniDetailClient
      key={`${doklad}-${poradiSkol}`}
      doklad={doklad}
      poradiSkol={poradiSkol}
      returnTo={resolvedSearchParams.returnTo ?? null}
    />
  )
}

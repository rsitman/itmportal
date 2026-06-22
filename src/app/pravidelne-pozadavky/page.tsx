import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import RegularRequestsClient from '@/components/projects/RegularRequestsClient'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Přehled aktuálních pravidelných požadavků',
  description: 'Seznam všech aktuálních pravidelných požadavků',
}

export default async function RegularRequestsPage() {
  const configuredSession = await getServerSession(authOptions)

  if (!configuredSession) {
    redirect('/login')
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <RegularRequestsClient
        endpoint="/api/jpp"
        title="Přehled aktuálních pravidelných požadavků"
        description="Seznam všech aktuálních pravidelných požadavků z IS KARAT"
        emptyMessage="Nebyly nalezeny žádné aktuální pravidelné požadavky."
      />
    </div>
  )
}

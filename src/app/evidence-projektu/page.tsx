import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProjectsRegistryClient from '@/components/projects/ProjectsRegistryClient'

export const metadata: Metadata = {
  title: 'Evidence projektů',
  description: 'Kompletní evidence a správa projektů',
}

export default async function ProjectsRegistryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Evidence projektů</h1>
            <p className="text-sm text-gray-400 mt-1">Přehled servisních projektů a rychlý přístup do navazujících oblastí</p>
          </div>
        </header>
        <ProjectsRegistryClient />
      </div>
    </div>
  )
}

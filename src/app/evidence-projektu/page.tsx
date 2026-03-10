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
    <div className="w-full py-10 bg-transparent">
      {/* Header */}
      <div className="card-professional shadow-sm border-b border-gray-700/50">
        <div className="px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Evidence projektů</h1>
            <p className="text-gray-300 mt-1">Přehled servisních projektů a rychlý přístup do navazujících oblastí</p>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <ProjectsRegistryClient />
      </div>
    </div>
  )
}

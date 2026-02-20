import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'
import { logger } from '@/lib/logger'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Detail projektu',
  description: 'Detailní informace o projektu',
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const companyId = resolvedParams.id

  try {
    // TODO: Fetch project data from Project Management System
    // For now, we'll show a placeholder with the company ID
    const projectData = {
      companyId,
      projectName: 'Načítám...',
      companyName: 'Načítám...',
    }

    return (
      <div className="w-full py-10">
        <div className="mb-8 px-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Detail projektu
          </h1>
          <p className="text-lg text-gray-600">
            Projekt: {projectData.companyId}
          </p>
        </div>

        <ProjectDetailClient 
          companyId={companyId}
          initialData={projectData}
        />
      </div>
    )
  } catch (error) {
    logger.error('Error loading project:', error)
    notFound()
  }
}

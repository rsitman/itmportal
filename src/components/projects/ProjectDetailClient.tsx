'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types/project'
import MetaDetail from '@/components/meta/MetaDetail'
import { projectDetailMeta } from '@/lib/meta/projectDetailMeta'
import { logger } from '@/lib/logger'

interface ProjectDetailClientProps {
  companyId: string
  initialData: {
    companyId: string
    projectName: string
    companyName: string
  }
}

export default function ProjectDetailClient({ companyId, initialData }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${companyId}`)
        
        if (response.ok) {
          const data = await response.json()
          setProject(data)
        } else if (response.status === 404) {
          setError('Projekt nebyl nalezen')
        } else {
          setError('Nepodařilo se načíst data projektu')
        }
      } catch (error) {
        logger.error('Error fetching project data:', error)
        setError('Došlo k chybě při načítání dat')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [companyId])

  if (loading) {
    return (
      <div className="px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Chyba</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="px-6">
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Projekt nebyl nalezen
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Projekt s ID {companyId} neexistuje.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {project.projectName}
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              {project.companyName}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>ID: {project.projectId}</span>
              <span>Verze: {project.version}</span>
              <span>Stát: {project.country}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Upravit
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Project Detail using MetaDetail */}
      <MetaDetail meta={projectDetailMeta} data={project} />
    </div>
  )
}

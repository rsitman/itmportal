'use client'

import { useState, useEffect } from 'react'
import { ServiceProject } from '@/types/project'
import MetaTable from '@/components/meta/MetaTable'
import { projectsRegistryMeta } from '@/lib/meta/projectsRegistryMeta'
import { logger } from '@/lib/logger'

interface ProjectsRegistryClientProps {
  initialProjects: any[]
}

export default function ProjectsRegistryClient({ initialProjects }: ProjectsRegistryClientProps) {
  const [serviceProjects, setServiceProjects] = useState<ServiceProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service projects from new endpoint
        const serviceResponse = await fetch('/api/service-projects')
        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json()
          setServiceProjects(serviceData)
        }
      } catch (error) {
        logger.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePatchClick = (project: ServiceProject) => {
    // Otevření přehledu patchování zafiltrovaného za firmu ve stejném okně
    const url = `/plan_patchovani?q=${encodeURIComponent(project.nazev_par)}`
    window.location.href = url
  }

  if (loading) {
    return (
      <div className="px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  if (serviceProjects.length === 0) {
    return (
      <div className="px-6">
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6">
          <h3 className="text-sm font-medium text-green-400 mb-2">Žádné servisní projekty</h3>
          <p className="text-gray-300">
            Nebyly nalezeny žádné servisní projekty.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Evidence projektů</h2>
        <p className="text-gray-300 mt-2">
          Seznam všech servisních projektů z IS KARAT
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceProjects.map((project, index) => (
          <div key={`${project.doklad_proj || 'no-id'}-${project.nazev || 'no-name'}-${index}`} className="card-professional p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {project.nazev}
                </h3>
                <p className="text-sm text-gray-400 font-mono">
                  {project.doklad_proj}
                </p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const url = `/projects/doklad-projektu/${project.doklad_proj}/team`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Tým
                </button>
                <button 
                  onClick={() => {
                    const url = `/projects/doklad-projektu/${project.doklad_proj}/extcomps`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  SW
                </button>
                <button 
                  onClick={() => handlePatchClick(project)}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Patch
                </button>
                <button 
                  onClick={() => {
                    const url = `/databases?projekt=${encodeURIComponent(project.doklad_proj)}`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  DB
                </button>
                <button 
                  onClick={() => {
                    const url = `/settings/hwsw?projekt=${encodeURIComponent(project.doklad_proj)}`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  HW
                </button>
                <button 
                  onClick={() => {
                    const url = `/upgrades?projekt=${encodeURIComponent(project.doklad_proj)}`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 0h.01M6 19a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 001 1h2a2 2 0 001 1v11a2 2 0 01-2 2m0-1h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0h2a2 2 0 002 2v11m-4 0h2a2 2 0 012 2v-3" />
                  </svg>
                  Upgrady
                </button>
                <button 
                  onClick={() => {
                    const url = `/hwsw-config?projekt=${encodeURIComponent(project.doklad_proj)}`
                    window.location.href = url
                  }}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Konfig
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

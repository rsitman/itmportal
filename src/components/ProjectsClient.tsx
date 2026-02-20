'use client'

import { useState, useMemo } from 'react'
import { KaratProject } from '@/lib/karat'
import MetaTable from '@/components/meta/MetaTable'
import { projectsMeta } from '@/lib/meta/projectsMeta'
import { logger } from '@/lib/logger'

function StatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        enabled
          ? 'bg-green-900/50 text-green-200 border border-green-800'
          : 'bg-red-900/50 text-red-200 border border-red-800'
      }`}
    >
      {enabled ? '✓' : '✗'} {label}
    </span>
  )
}

function formatDate(dateInput: any): string {
  if (!dateInput) {
    return '—'
  }
  
  // If it's a string, try to parse it
  if (typeof dateInput === 'string') {
    const parsedDate = new Date(dateInput);
    if (isNaN(parsedDate.getTime())) {
      return '—'
    }
    return parsedDate.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  
  // If it's already a Date object
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return '—'
    }
    return dateInput.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  
  return '—'
}

function SearchAndFilter({ 
  onSearch
}: { 
  onSearch: (query: string) => void
}) {
  return (
    <div className="flex">
      <div className="relative w-96">
        <input
          type="text"
          placeholder="Hledat projekt, firmu..."
          onChange={(e) => onSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 placeholder-gray-400 text-white focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-green-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsClient({ projects }: { projects: KaratProject[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Debug logování pro zobrazení datové struktury
  logger.log('ProjectsClient received projects:', projects.length)
  if (projects.length > 0) {
    logger.log('Sample project data:', projects[0])
  }

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    
    const query = searchQuery.toLowerCase()
    return projects.filter(project => 
      project.projectName.toLowerCase().includes(query) ||
      project.companyName.toLowerCase().includes(query) ||
      project.companyId.toLowerCase().includes(query) ||
      project.country.toLowerCase().includes(query) ||
      (project.accountManager?.toLowerCase().includes(query) || false) ||
      (project.jiraKey?.toLowerCase().includes(query) || false)
    )
  }, [projects, searchQuery])

  return (
    <div className="py-4 px-6">
      <SearchAndFilter 
        onSearch={setSearchQuery}
      />
      
      <div className="mt-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 01-2.2v7m16 0v5a2 2 0 01-.707.293l-2.414 2.414a1 1 0 00-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'Žádné výsledky hledání' : 'Žádné projekty'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? `Nebyly nalezeny žádné projekty pro dotaz "${searchQuery}".`
                  : 'Nebyly nalezeny žádné projekty v KARAT systému.'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <MetaTable meta={projectsMeta} rows={filteredProjects} />
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.projectName}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-800">
                        {project.version}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Firma</p>
                        <p className="text-sm text-gray-900">{project.companyName}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">JIRA klíč</p>
                        <p className="text-sm text-gray-900">{project.jiraKey}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Akce</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const url = `/patch-modules?projekt=${encodeURIComponent(project.projectId)}&firma=${encodeURIComponent(project.companyId)}`
                              window.location.href = url
                            }}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

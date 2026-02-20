'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PatchModule } from '@/types/project'
import { logger } from '@/lib/logger'

function PatchModulesContent() {
  const searchParams = useSearchParams()
  const [patchModules, setPatchModules] = useState<PatchModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectInfo, setProjectInfo] = useState<{ projekt: string; firma: string } | null>(null)

  useEffect(() => {
    const projekt = searchParams.get('projekt')
    const firma = searchParams.get('firma')
    
    if (!projekt || !firma) {
      setError('Chybí parametry: projekt a firma jsou povinné')
      setLoading(false)
      return
    }

    setProjectInfo({ projekt, firma })
    fetchPatchModules(projekt, firma)
  }, [searchParams])

  const fetchPatchModules = async (projekt: string, firma: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/karat/patch-modules-by-company?projekt=${encodeURIComponent(projekt)}&id_firmy=${encodeURIComponent(firma)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch patch modules: ${response.status}`)
      }
      
      const data = await response.json()
      setPatchModules(data)
    } catch (error: any) {
      logger.error('Error fetching patch modules:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání patch modulů...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Chyba při načítání</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
            <div className="mb-8 px-6">
              <h1 className="text-3xl font-bold text-gray-900">Patch moduly</h1>
              <p className="mt-1 text-sm text-gray-600">
                {projectInfo && (
                  <>Projekt: {projectInfo.projekt} | Firma: {projectInfo.firma}</>
                )}
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Vysvětlení:</strong> Standard = funkční patche (úroveň 40) | Stát = legislativní patche (úroveň 36) | ✓ = aktuální | ⚠ = vyžaduje aktualizaci
                </p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Zpět
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {patchModules.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-green-200 rounded-md p-8 max-w-md mx-auto">
              <div className="text-green-500">
                <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-green-900">
                Žádné patch moduly
              </h3>
              <p className="mt-1 text-green-600">
                Pro tento projekt nebyly nalezeny žádné patch moduly.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Seznam patch modulů ({patchModules.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Modulu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Název modulu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verze
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stát
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standard - Nainstalován
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standard - Dostupný
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stát - Nainstalován
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stát - Dostupný
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stav
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patchModules.map((module, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{module.id_modulu}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {module.nazev}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-green-800">
                          {module.verze}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {module.stat}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm ${
                          module.posl_patch_40 !== module.max_patch_40 && module.posl_patch_40 !== '000' && module.max_patch_40 !== '000'
                            ? 'text-red-700 bg-red-50 px-2 py-1 rounded font-semibold'
                            : 'text-gray-900'
                        }`}>
                          {module.posl_patch_40}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{module.max_patch_40}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm ${
                          module.posl_patch_36 !== module.max_patch_36 && module.posl_patch_36 !== '000' && module.max_patch_36 !== '000'
                            ? 'text-red-700 bg-red-50 px-2 py-1 rounded font-semibold'
                            : 'text-gray-900'
                        }`}>
                          {module.posl_patch_36}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{module.max_patch_36}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const standardOk = module.posl_patch_40 === module.max_patch_40 || module.posl_patch_40 === '000' || module.max_patch_40 === '000'
                          const statOk = module.posl_patch_36 === module.max_patch_36 || module.posl_patch_36 === '000' || module.max_patch_36 === '000'
                          
                          if (standardOk && statOk) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                ✓ Vše OK
                              </span>
                            )
                          } else {
                            const problems = []
                            if (!standardOk && module.posl_patch_40 !== '000' && module.max_patch_40 !== '000') {
                              problems.push('Standard')
                            }
                            if (!statOk && module.posl_patch_36 !== '000' && module.max_patch_36 !== '000') {
                              problems.push('Stát')
                            }
                            
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                ⚠ {problems.join(' + ')}
                              </span>
                            )
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PatchModulesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatchModulesContent />
    </Suspense>
  )
} 

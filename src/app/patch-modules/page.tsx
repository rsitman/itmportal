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
        <div className="text-center px-4">
          <div className="bg-red-900/70 border border-red-600/80 rounded-md p-5 max-w-md mx-auto shadow-soft">
            <h3 className="text-lg font-semibold text-red-50 mb-2">Chyba při načítání</h3>
            <p className="text-sm text-red-100 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-slate-900/70 shadow-soft border-b border-slate-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
            <div className="mb-2 px-2">
              <h1 className="text-3xl font-bold text-white">Patch moduly</h1>
              <p className="mt-1 text-sm text-slate-200">
                {projectInfo && (
                  <>Projekt: {projectInfo.projekt} | Firma: {projectInfo.firma}</>
                )}
              </p>
              <div className="mt-3 p-3 rounded-md border border-emerald-500/60 bg-slate-900/80 max-w-3xl">
                <p className="text-sm text-emerald-100">
                  <span className="font-semibold">Vysvětlení:</span>{' '}
                  <span className="text-slate-100">
                    Standard = funkční patche (úroveň 40) | Stát = legislativní patche (úroveň 36) | ✓ = aktuální | ⚠ = vyžaduje aktualizaci
                  </span>
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
            <div className="bg-slate-900/70 border border-emerald-500/60 rounded-md p-8 max-w-md mx-auto shadow-soft">
              <div className="text-emerald-400">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-slate-900/70 shadow-soft rounded-lg overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Seznam patch modulů ({patchModules.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <table className="w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      ID Modulu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Název modulu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Verze
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Stát
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Standard - Nainstalován
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Standard - Dostupný
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Stát - Nainstalován
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Stát - Dostupný
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Stav
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-800">
                  {patchModules.map((module, index) => (
                    <tr key={index} className="hover:bg-slate-800/80">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-100">{module.id_modulu}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-100">
                          {module.nazev}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-900/60 text-sky-200 border border-sky-500/70">
                          {module.verze}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-200 border border-emerald-500/70">
                          {module.stat}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm ${
                          module.posl_patch_40 !== module.max_patch_40 && module.posl_patch_40 !== '000' && module.max_patch_40 !== '000'
                            ? 'text-red-100 bg-red-900/60 px-2 py-1 rounded font-semibold border border-red-500/70'
                            : 'text-slate-100'
                        }`}>
                          {module.posl_patch_40}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-100">{module.max_patch_40}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm ${
                          module.posl_patch_36 !== module.max_patch_36 && module.posl_patch_36 !== '000' && module.max_patch_36 !== '000'
                            ? 'text-red-100 bg-red-900/60 px-2 py-1 rounded font-semibold border border-red-500/70'
                            : 'text-slate-100'
                        }`}>
                          {module.posl_patch_36}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-100">{module.max_patch_36}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const standardOk = module.posl_patch_40 === module.max_patch_40 || module.posl_patch_40 === '000' || module.max_patch_40 === '000'
                          const statOk = module.posl_patch_36 === module.max_patch_36 || module.posl_patch_36 === '000' || module.max_patch_36 === '000'
                          
                          if (standardOk && statOk) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-900/70 text-emerald-200 border border-emerald-500/80">
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
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-900/70 text-amber-200 border border-amber-500/80">
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

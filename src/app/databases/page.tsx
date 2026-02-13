'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Database } from '@/types/database'
import { DatabaseServiceExtended } from '@/lib/database-service-extended'
import DatabasesTable from '@/components/DatabasesTable'

function DatabasesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [databases, setDatabases] = useState<Database[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchDatabases()
  }, [])

  useEffect(() => {
    const projektParam = searchParams.get('projekt')
    if (projektParam) {
      setSelectedProject(projektParam)
    }
  }, [searchParams])

  const fetchDatabases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await DatabaseServiceExtended.getDatabases()
      setDatabases(data)
      
    } catch (error) {
      
      // Detekce síťových chyb
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isNetworkError = errorMessage.includes('fetch') || 
                            errorMessage.includes('NetworkError') || 
                            errorMessage.includes('ECONNREFUSED') ||
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('Failed to fetch') ||
                            errorMessage.includes('proxyError')
      
      if (isNetworkError) {
        setError('Nelze se připojit k databázovému serveru. Zkuste to znovu nebo kontaktujte administrátora.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filtrace databází
  const filteredDatabases = databases.filter(database => {
    const matchesSearch = searchTerm === '' || 
      database.firma_nazev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      database.projekt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      database.databaze.toLowerCase().includes(searchTerm.toLowerCase()) ||
      database.id_firmy.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCompany = !selectedCompany || database.firma_nazev === selectedCompany
    const matchesProject = !selectedProject || database.projekt === selectedProject
    
    return matchesSearch && matchesCompany && matchesProject
  })

  // Seznam firem pro filtr
  const companies = [...new Set(databases.map(d => d.firma_nazev))].sort()

  // Statistiky
  const stats = DatabaseServiceExtended.getDatabaseStats(databases)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání databází...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">🌐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chyba připojení</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Diagnostika:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Server URL: <code className="bg-white px-2 py-1 rounded">http://itmsql01:44612/web/databases</code></li>
              <li>• Zkontrolujte, zda je server dostupný</li>
              <li>• Ověřte síťové připojení a firewall</li>
              <li>• Kontaktujte administrátora pokud problém přetrvává</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={fetchDatabases}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zkusit znovu
            </button>
            <button
              onClick={() => window.open('http://itmsql01:44612/web/databases', '_blank')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Otevřít server přímo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aktuální stav databází</h1>
              <p className="text-gray-600 mt-1">Přehled stavu a využití databází v IS KARAT</p>
            </div>
            <button
              onClick={fetchDatabases}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Obnovit
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiky */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Celkem databází</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDatabases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Celková velikost</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSize.toLocaleString()} MB</p>
                <p className="text-xs text-gray-500">{stats.usagePercentage}% využito</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kritické DB</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalDatabases}</p>
                <p className="text-xs text-gray-500">&gt; 90% využito</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Málo místa</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowSpaceDatabases}</p>
                <p className="text-xs text-gray-500">&lt; 90 dní</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtry */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Indikace aktivního filtru projektu */}
          {selectedProject && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    Filtrováno podle projektu: <code className="bg-blue-100 px-2 py-1 rounded text-xs">{selectedProject}</code>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null)
                    router.push('/databases')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Zrušit filtr
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hledat</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Firma, projekt, databáze, ID firmy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firma</label>
              <select
                value={selectedCompany || ''}
                onChange={(e) => setSelectedCompany(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Všechny firmy</option>
                {companies.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="w-full">
        {/* Seznam databází */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Seznam databází ({filteredDatabases.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <DatabasesTable databases={filteredDatabases} />
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default function DatabasesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DatabasesContent />
    </Suspense>
  )
}

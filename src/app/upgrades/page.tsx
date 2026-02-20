'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Upgrade } from '@/types/upgrade'
import { UpgradeService } from '@/lib/upgrade-service'
import UpgradesTable from '@/components/UpgradesTableNew'

function UpgradesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [upgrades, setUpgrades] = useState<Upgrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchUpgrades()
  }, [])

  // Získání projektu z URL parametru
  useEffect(() => {
    const projectFromUrl = searchParams.get('projekt')
    if (projectFromUrl) {
      setSelectedProject(projectFromUrl)
    }
  }, [searchParams])

  const fetchUpgrades = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await UpgradeService.getUpgrades()
      setUpgrades(data)
      
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
        setError('Nelze se připojit k upgradovacímu serveru. Zkuste to znovu nebo kontaktujte administrátora.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filtrace upgradů
  const filteredUpgrades = upgrades.filter(upgrade => {
    const matchesSearch = searchTerm === '' || 
      upgrade.nazev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upgrade.projekt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upgrade.resitel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upgrade.jira_klic.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProject = !selectedProject || upgrade.projekt === selectedProject
    
    return matchesSearch && matchesProject
  })

  // Seznam projektů pro filtr
  const projects = [...new Set(upgrades.map(u => u.projekt))].sort()

  // Statistiky
  const stats = {
    total: upgrades.length,
    projects: projects.length,
    thisMonth: upgrades.filter(u => {
      const upgradeDate = new Date(u.datum_od)
      const now = new Date()
      return upgradeDate.getMonth() === now.getMonth() && 
             upgradeDate.getFullYear() === now.getFullYear()
    }).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání upgradů...</p>
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
              <li>• Server URL: <code className="bg-white px-2 py-1 rounded">http://itmsql01:44612/web/upgrades</code></li>
              <li>• Zkontrolujte, zda je server dostupný</li>
              <li>• Ověřte síťové připojení a firewall</li>
              <li>• Kontaktujte administrátora pokud problém přetrvává</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={fetchUpgrades}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
            </button>
            <button
              onClick={() => window.open('http://itmsql01:44612/web/upgrades', '_blank')}
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
    <div className="w-full py-10 bg-transparent">
      <div className="mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Správa upgradů
        </h1>
        <p className="text-lg text-gray-300">
          Přehled plánovaných a realizovaných upgradů
        </p>
      </div>
      
      <div className="px-6">
        <button
          onClick={fetchUpgrades}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Obnovit
        </button>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-900/50 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 0h.01M6 19a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 001 1h2a2 2 0 001 1v11a2 2 0 01-2 2m0-1h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0h2a2 2 0 002 2v11m-4 0h2a2 2 0 012 2v-3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Celkem upgradů</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-900/50 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Aktivních projektů</p>
                <p className="text-2xl font-bold text-white">{stats.projects}</p>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-900/50 rounded-lg p-3">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tento měsíc</p>
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtry */}
        <div className="card-professional p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hledat</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Název projektu, řešitel, JIRA klíč..."
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Projekt</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Všechny projekty</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project} - {upgrades.find(u => u.projekt === project)?.nazev || `Projekt ${project}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="w-full px-6">
        {/* Seznam upgradů */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white text-left">
            Seznam upgradů ({filteredUpgrades.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <UpgradesTable upgrades={filteredUpgrades} />
        </div>
      </div>
    </div>
  )
}

export default function UpgradesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradesContent />
    </Suspense>
  )
}
// Force refresh Thu Feb  5 02:56:17 PM CET 2026

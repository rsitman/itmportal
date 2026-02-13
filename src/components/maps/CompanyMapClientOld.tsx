'use client'

import { useState, useEffect } from 'react'
import CompanyMap from './CompanyMap'

interface Company {
  id: string
  name: string
  address: string
  city: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website?: string
  employees?: number
  foundedYear?: number
  industry?: string
  description?: string
  isProject?: boolean // Flag to distinguish projects from regular companies
  isDatabase?: boolean // Flag to distinguish databases from projects
  projectId?: string // KARAT project ID
  jiraKey?: string // JIRA key for projects
  customerName?: string // Název zákazníka/firmy
}

interface MapData {
  companies: Company[]
  metadata: {
    totalCompanies: number
    countries: string[]
    cities: string[]
    industries: string[]
    employeeStats: {
      total: number
      average: number
      max: number
      min: number
    }
    projectCount?: number // Number of projects
    databaseCount?: number // Number of databases
  }
}

export default function CompanyMapClient() {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/map-data')
        if (!response.ok) {
          throw new Error('Failed to fetch map data')
        }
        const mapData = await response.json()
        setData(mapData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="px-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Načítání dat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">❌</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Žádná data nebyla nalezena</p>
          </div>
        </div>
      </div>
    )
  }

  // Filter companies based on selected industry and search term
  const filteredCompanies = data.companies.filter((company: Company) => {
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry
    const matchesSearch = searchTerm === '' || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.customerName && company.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesIndustry && matchesSearch
  })

  return (
    <div className="px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mapa poboček</h1>
        <p className="text-gray-600">Interaktivní mapa zobrazující všechny pobočky firem</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odvětví
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Všechna odvětví</option>
                {data.metadata.industries.map((industry: string) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hledat firmu
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Název, adresa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[100px]">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Obnovit data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <CompanyMap
        companies={filteredCompanies}
        height="600px"
        showControls={true}
        className="mb-6"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Celkem firem</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.totalCompanies.toLocaleString('cs-CZ')}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Počet zemí</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.countries.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Počet měst</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.cities.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Celkem zaměstnanců</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.employeeStats.total.toLocaleString('cs-CZ')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Průměr: {Math.round(data.metadata.employeeStats.average).toLocaleString('cs-CZ')}
          </p>
        </div>
      </div>

      {/* Project Statistics */}
      {data.metadata.projectCount !== undefined && data.metadata.projectCount > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">🗂️ Statistika projektů</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Počet projektů</h4>
              <p className="text-2xl font-bold text-blue-600">
                {data.metadata.projectCount.toLocaleString('cs-CZ')}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Celkem položek</h4>
              <p className="text-2xl font-bold text-gray-900">
                {(data.metadata.totalCompanies + data.metadata.projectCount).toLocaleString('cs-CZ')}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Projekty z celku</h4>
              <p className="text-2xl font-bold text-gray-900">
                {data.metadata.projectCount > 0 
                  ? `${Math.round((data.metadata.projectCount / (data.metadata.totalCompanies + data.metadata.projectCount)) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
          
          {/* Customer Statistics */}
          <div className="mt-4 bg-purple-50 rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-purple-900 mb-3">🏢 Statistika zákazníků</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Počet zákazníků</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {Array.from(new Set(data.companies.filter((c: any) => c.isProject).map((c: any) => c.customerName))).length.toLocaleString('cs-CZ')}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Průměrné databáze na projekt</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {data.metadata.projectCount > 0 && [...new Set(data.companies.filter((c: any) => c.isProject).map((c: any) => c.customerName))].length > 0
                    ? (data.metadata.projectCount / [...new Set(data.companies.filter((c: any) => c.isProject).map((c: any) => c.customerName))].length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company List */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Seznam položek ({filteredCompanies.length})</h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredCompanies.map((company: any) => (
            <div key={company.id} className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-500">
                    {company.address}, {company.city}, {company.country}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {company.employees && (
                      <span className="text-xs text-gray-400">
                        👥 {company.employees} zaměstnanců
                      </span>
                    )}
                    {company.industry && (
                      <span className="text-xs text-gray-400">
                        🏭 {company.industry}
                      </span>
                    )}
                    {company.foundedYear && (
                      <span className="text-xs text-gray-400">
                        📅 {company.foundedYear}
                      </span>
                    )}
                    {company.isProject && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                        🗂️ Projekt
                      </span>
                    )}
                    {company.customerName && company.isProject && (
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
                        🏢 {company.customerName}
                      </span>
                    )}
                    {company.jiraKey && (
                      <span className="text-xs text-gray-400">
                        🔑 {company.jiraKey}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {company.latitude.toFixed(4)}, {company.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

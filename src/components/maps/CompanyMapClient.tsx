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
  isProject?: boolean
  isDatabase?: boolean
  projectId?: string
  jiraKey?: string
  customerName?: string
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
    projectCount?: number
    databaseCount?: number
  }
}

export default function CompanyMapClient() {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [mapRef, setMapRef] = useState<any>(null)

  // Function to focus on specific location on map
  const focusOnLocation = (lat: number, lng: number, zoom: number = 15) => {
    if (mapRef) {
      // console.log('Focusing on location:', lat, lng)
      
      // Set view to the location
      mapRef.setView([lat, lng], zoom)
      
      // Find and open popup for this location by checking all markers
      setTimeout(() => {
        const markers = document.querySelectorAll('.leaflet-marker-icon')
        // console.log('Found markers:', markers.length)
        
        markers.forEach((marker, index) => {
          const markerElement = marker as HTMLElement
          const icon = markerElement.querySelector('div')
          
          if (icon) {
            // Get the marker's position from the map instance
            const markerLatLng = mapRef.containerPointToLatLng([
              markerElement.offsetLeft + 20, 
              markerElement.offsetTop + 40
            ])
            
            // console.log(`Marker ${index} position:`, markerLatLng.lat, markerLatLng.lng)
            // console.log(`Target position:`, lat, lng)
            
            // Check if this marker is close to our target location
            if (Math.abs(markerLatLng.lat - lat) < 0.01 && Math.abs(markerLatLng.lng - lng) < 0.01) {
              // console.log('Found matching marker, clicking...')
              // Trigger click to open popup
              markerElement.click()
              return
            }
          }
        })
      }, 500) // Wait for map to settle
    } else {
      // console.log('Map reference not available')
    }
  }

  // Function to handle click on list item
  const handleListItemClick = (company: any) => {
    // console.log('Clicked on company:', company.name, 'at', company.latitude, company.longitude)
    focusOnLocation(company.latitude, company.longitude)
  }

  // Handle map ready
  const handleMapReady = (map: any) => {
    // console.log('Map is ready:', map)
    setMapRef(map)
  }

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
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Načítání dat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">Žádná data nebyla nalezena</p>
        </div>
      </div>
    )
  }

  const filteredCompanies = data.companies.filter((company: Company) => {
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry
    const matchesSearch = searchTerm === '' || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.customerName && company.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesIndustry && matchesSearch
  })

  const getUniqueCustomers = () => {
    const customers = data.companies
      .filter((c: any) => c.isProject && c.customerName)
      .map((c: any) => c.customerName)
    return Array.from(new Set(customers))
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Mapa projektů
            </h1>
            <p className="text-lg text-gray-300">
              Interaktivní mapa zobrazující všechny projekty a pobočky firem
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Obnovit
          </button>
        </div>

        <div className="card-professional p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Odvětví
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-blue-500 focus:border-green-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hledat firmu
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Název, adresa..."
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <CompanyMap
          companies={filteredCompanies}
          height="600px"
          showControls={true}
          className="mb-6"
          onMapReady={handleMapReady}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-professional p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Celkem firem</h3>
            <p className="text-2xl font-bold text-white">
              {data.metadata.totalCompanies.toLocaleString('cs-CZ')}
            </p>
          </div>
          
          <div className="card-professional p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Počet zemí</h3>
            <p className="text-2xl font-bold text-white">
              {data.metadata.countries.length}
            </p>
          </div>
          
          <div className="card-professional p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Počet měst</h3>
            <p className="text-2xl font-bold text-white">
              {data.metadata.cities.length}
            </p>
          </div>
          
          <div className="card-professional p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Celkem zaměstnanců</h3>
            <p className="text-2xl font-bold text-white">
              {data.metadata.employeeStats.total.toLocaleString('cs-CZ')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Průměr: {Math.round(data.metadata.employeeStats.average).toLocaleString('cs-CZ')}
            </p>
          </div>
        </div>

        {data.metadata.projectCount !== undefined && data.metadata.projectCount > 0 && (
          <div className="mt-6 card-professional p-4">
            <h3 className="text-lg font-medium text-green-400 mb-3">🗂️ Statistika projektů</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-professional p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Počet projektů</h4>
                <p className="text-2xl font-bold text-green-400">
                  {data.metadata.projectCount.toLocaleString('cs-CZ')}
                </p>
              </div>
              <div className="card-professional p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Celkem položek</h4>
                <p className="text-2xl font-bold text-white">
                  {(data.metadata.totalCompanies + data.metadata.projectCount).toLocaleString('cs-CZ')}
                </p>
              </div>
              <div className="card-professional p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Projekty z celku</h4>
                <p className="text-2xl font-bold text-white">
                  {data.metadata.projectCount > 0 
                    ? `${Math.round((data.metadata.projectCount / (data.metadata.totalCompanies + data.metadata.projectCount)) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-4 card-professional p-4">
              <h3 className="text-lg font-medium text-purple-400 mb-3">🏢 Statistika zákazníků</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-professional p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Počet zákazníků</h4>
                  <p className="text-2xl font-bold text-purple-400">
                    {getUniqueCustomers().length.toLocaleString('cs-CZ')}
                  </p>
                </div>
                <div className="card-professional p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Průměrné databáze na projekt</h4>
                  <p className="text-2xl font-bold text-white">
                    {data.metadata.projectCount > 0 && getUniqueCustomers().length > 0
                      ? (data.metadata.projectCount / getUniqueCustomers().length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 card-professional rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <h3 className="text-lg font-medium text-white">
              Seznam položek ({filteredCompanies.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto bg-gray-800/50">
            {filteredCompanies.map((company: any) => (
              <div 
                key={company.id} 
                className="px-6 py-4 hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => handleListItemClick(company)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      {company.name}
                      <span className="text-xs text-green-400">📍 Klikněte pro zobrazení na mapě</span>
                    </h4>
                    <p className="text-sm text-gray-300">
                      {company.address}, {company.city}, {company.country}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {company.employees && (
                        <span className="text-xs text-gray-200">
                          👥 {company.employees} zaměstnanců
                        </span>
                      )}
                      {company.industry && (
                        <span className="text-xs text-gray-200">
                          🏭 {company.industry}
                        </span>
                      )}
                      {company.foundedYear && (
                        <span className="text-xs text-gray-200">
                          📅 {company.foundedYear}
                        </span>
                      )}
                      {company.isProject && (
                        <span className="text-xs text-green-300 font-medium bg-blue-900/50 px-2 py-1 rounded border border-green-600">
                          🗂️ Projekt
                        </span>
                      )}
                      {company.customerName && company.isProject && (
                        <span className="text-xs text-purple-300 font-medium bg-purple-900/50 px-2 py-1 rounded border border-purple-600">
                          🏢 {company.customerName}
                        </span>
                      )}
                      {company.jiraKey && (
                        <span className="text-xs text-gray-200">
                          🔑 {company.jiraKey}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {company.latitude.toFixed(4)}, {company.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

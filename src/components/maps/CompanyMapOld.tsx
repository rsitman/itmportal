'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { logger } from '@/lib/logger'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

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
}

interface CompanyMapProps {
  companies?: Company[]
  height?: string
  showControls?: boolean
  className?: string
}

// Component to fit map to markers
const MapController = ({ companies }: { companies: Company[] }) => {
  const map = useMap()

  useEffect(() => {
    if (companies && companies.length > 0) {
      const bounds = new LatLngBounds(
        companies.map(company => [company.latitude, company.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [companies, map])

  return null
}

const CompanyMap = ({ 
  companies = [], 
  height = '500px', 
  showControls = true,
  className = '' 
}: CompanyMapProps) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0755, 14.4378]) // Prague
  const [mapZoom, setMapZoom] = useState(7)

  // Update map center when companies change
  useEffect(() => {
    if (companies.length > 0) {
      const avgLat = companies.reduce((sum, c) => sum + c.latitude, 0) / companies.length
      const avgLng = companies.reduce((sum, c) => sum + c.longitude, 0) / companies.length
      setMapCenter([avgLat, avgLng])
    }
  }, [companies])

  // Custom icon for companies
  const createCustomIcon = (company: Company) => {
    const iconColor = company.employees && company.employees > 100 ? '#dc2626' : 
                     company.employees && company.employees > 50 ? '#f59e0b' : '#10b981'
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24c0-8.8-7.2-16-16-16z" fill="${iconColor}" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="16" r="8" fill="#fff"/>
          <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="${iconColor}">
            ${company.name.substring(0, 2).toUpperCase()}
          </text>
        </svg>
      `)}`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMiA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9InNoYWRvdyIgeD0iLTUwJSIgeT0iLTUwJSIgd2lkdGg9IjIwMCUiIGhlaWdodD0iMjAwJSI+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlQWxwaGEiIHN0ZERldmlhdGlvbj0iMyIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxwYXRoIGQ9Ik0xNiA0QzkuNCA0IDQgOS40IDQgMTZjMCAxMiAxNiAyNCAxNiAyNHMxNi0xMiAxNi0yNGMwLTYuNi01LjQtMTItMTItMTJ6IiBmaWx0ZXI9InVybCgjc2hhZG93KSIgb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==',
      shadowSize: [32, 40],
      shadowAnchor: [16, 40]
    })
  }

  if (typeof window === 'undefined') {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-gray-500">Načítání mapy...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 space-y-2">
          <div className="text-xs text-gray-600 font-medium mb-1">Filtry</div>
          
          {/* Employee count filter */}
          <select 
            className="text-xs px-2 py-1 border border-gray-300 rounded"
            onChange={(e) => {
              // Filter logic can be implemented here
              logger.log('Filter by employees:', e.target.value)
            }}
          >
            <option value="all">Všechny firmy</option>
            <option value="large">Velké (100+)</option>
            <option value="medium">Střední (50-99)</option>
            <option value="small">Malé (&lt;50)</option>
          </select>

          {/* Industry filter */}
          <select 
            className="text-xs px-2 py-1 border border-gray-300 rounded"
            onChange={(e) => {
              // Filter logic can be implemented here
              logger.log('Filter by industry:', e.target.value)
            }}
          >
            <option value="all">Všechny odvětví</option>
            <option value="technology">Technologie</option>
            <option value="manufacturing">Výroba</option>
            <option value="services">Služby</option>
            <option value="retail">Maloobchod</option>
          </select>
        </div>
      )}

      {/* Selected Company Info */}
      {selectedCompany && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <button 
            onClick={() => setSelectedCompany(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="font-semibold text-gray-900 mb-2">{selectedCompany.name}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{selectedCompany.address}, {selectedCompany.city}</p>
            <p>{selectedCompany.zipCode}, {selectedCompany.country}</p>
            {selectedCompany.phone && <p>📞 {selectedCompany.phone}</p>}
            {selectedCompany.email && <p>📧 {selectedCompany.email}</p>}
            {selectedCompany.website && (
              <p>🌐 <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedCompany.website}</a></p>
            )}
            {selectedCompany.employees && <p>👥 {selectedCompany.employees} zaměstnanců</p>}
            {selectedCompany.foundedYear && <p>📅 Založeno {selectedCompany.foundedYear}</p>}
            {selectedCompany.industry && <p>🏭 {selectedCompany.industry}</p>}
            {selectedCompany.description && <p className="text-xs mt-2">{selectedCompany.description}</p>}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController companies={companies} />
          
          {companies.map((company) => (
            <Marker
              key={company.id}
              position={[company.latitude, company.longitude]}
              icon={createCustomIcon(company)}
              eventHandlers={{
                click: () => setSelectedCompany(company),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">{company.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{company.address}</p>
                    <p>{company.city}, {company.zipCode}</p>
                    {company.phone && <p>📞 {company.phone}</p>}
                    {company.email && <p>📧 {company.email}</p>}
                    {company.employees && <p>👥 {company.employees} zaměstnanců</p>}
                  </div>
                  <button
                    onClick={() => setSelectedCompany(company)}
                    className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Detaily
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Statistics */}
      {showControls && companies.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="text-xs text-gray-600 font-medium mb-1">Statistiky</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">{companies.length}</span> poboček
            </div>
            <div className="text-xs">
              <span className="font-medium">
                {companies.filter(c => c.employees && c.employees > 100).length}
              </span> velkých firem
            </div>
            <div className="text-xs">
              <span className="font-medium">
                {companies.filter(c => c.employees && c.employees >= 50 && c.employees <= 100).length}
              </span> středních firem
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default dynamic(() => Promise.resolve(CompanyMap), { 
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '500px' }}>
      <div className="text-gray-500">Načítání mapy...</div>
    </div>
  )
})

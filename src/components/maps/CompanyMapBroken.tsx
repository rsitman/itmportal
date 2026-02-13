'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface Company {
  id: string
  name: string
  address: string
  city: string
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

interface CompanyMapProps {
  companies: Company[]
  height?: string
  showControls?: boolean
  className?: string
}

export default function CompanyMap({ companies, height = '400px', showControls = true, className = '' }: CompanyMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)
  const [Icon, setIcon] = useState<any>(null)
  const [LatLngBounds, setLatLngBounds] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import leaflet only on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet)
      
      // Fix for default markers in react-leaflet
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      })
      setIcon(leaflet.Icon)
      setLatLngBounds(leaflet.LatLngBounds)
      
      // Import CSS
      import('leaflet/dist/leaflet.css')
    })
  }, [])

  if (!isClient || !L || !Icon || !LatLngBounds) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Načítání mapy...</p>
        </div>
      </div>
    )
  }

  // Create bounds to fit all markers
  const bounds = companies.length > 0 
    ? new LatLngBounds(companies.map(company => [company.latitude, company.longitude]))
    : null

  // Custom icons for different types
  const createCustomIcon = (isProject: boolean = false) => {
    return new Icon({
      iconUrl: isProject ? '/leaflet/marker-icon-blue.png' : '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        bounds={bounds || undefined}
        boundsOptions={{ padding: [50, 50] }}
        style={{ height: '100%', width: '100%' }}
        zoom={bounds ? undefined : 10}
        center={bounds ? undefined : [50.0755, 14.4378]} // Default to Prague
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {companies.map((company) => (
          <Marker
            key={company.id}
            position={[company.latitude, company.longitude]}
            icon={createCustomIcon(company.isProject)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  📍 {company.address}, {company.city}, {company.country}
                </p>
                
                {company.employees && (
                  <p className="text-sm mb-1">
                    👥 {company.employees} zaměstnanců
                  </p>
                )}
                
                {company.industry && (
                  <p className="text-sm mb-1">
                    🏭 {company.industry}
                  </p>
                )}
                
                {company.foundedYear && (
                  <p className="text-sm mb-1">
                    📅 Založeno {company.foundedYear}
                  </p>
                )}
                
                {company.isProject && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      🗂️ Projekt
                    </span>
                  </div>
                )}
                
                {company.customerName && company.isProject && (
                  <p className="text-sm mt-1">
                    🏢 Zákazník: {company.customerName}
                  </p>
                )}
                
                {company.jiraKey && (
                  <p className="text-sm mt-1">
                    🔑 JIRA: {company.jiraKey}
                  </p>
                )}
                
                {company.phone && (
                  <p className="text-sm mt-1">
                    📞 {company.phone}
                  </p>
                )}
                
                {company.email && (
                  <p className="text-sm mt-1">
                    📧 {company.email}
                  </p>
                )}
                
                {company.website && (
                  <p className="text-sm mt-1">
                    🌐 <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {company.website}
                    </a>
                  </p>
                )}
                
                {company.description && (
                  <p className="text-sm mt-2 text-gray-700">
                    {company.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

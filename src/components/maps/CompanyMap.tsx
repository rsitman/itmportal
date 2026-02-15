'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'

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
  logoBase64?: string
}

interface CompanyMapProps {
  companies: Company[]
  height?: string
  showControls?: boolean
  className?: string
}

export default function CompanyMap({ companies, height = '400px', showControls = true, className = '' }: CompanyMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapComponents, setMapComponents] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import leaflet only on client side
    Promise.all([
      import('leaflet')
    ]).then(([leaflet]) => {
      // Add custom CSS for logo markers
      if (typeof document !== 'undefined') {
        const style = document.createElement('style')
        style.textContent = `
          .custom-marker-logo {
            border-radius: 50% !important;
            background: white !important;
            border: 2px solid #3b82f6 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          }
          .custom-marker-logo img {
            border-radius: 50% !important;
            object-fit: cover !important;
          }
        `
        document.head.appendChild(style)
      }
      
      setMapComponents({
        L: leaflet,
        Icon: leaflet.Icon,
        LatLngBounds: leaflet.LatLngBounds,
        DivIcon: leaflet.DivIcon
      })
    }).catch((error) => {
      logger.error('Error loading leaflet:', error)
    })
  }, [])

  if (!isClient || !mapComponents) {
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

  const { L, Icon, LatLngBounds, DivIcon } = mapComponents

  // Create bounds to fit all markers
  const bounds = companies.length > 0 
    ? new LatLngBounds(companies.map(company => [company.latitude, company.longitude]))
    : null

  // Custom icons using customer logos
  const createCustomIcon = (company: Company, DivIcon: any) => {
    // Use logoBase64 from API if available, otherwise generate fallback
    const logoUrl = company.logoBase64 || `/logos/default.png`
    
    // Create custom DivIcon with base64 logo
    return new DivIcon({
      html: `
        <div style="
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          background: white; 
          border: 2px solid #3b82f6; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${company.logoBase64 ? 
            `<img 
              src="${logoUrl}" 
              style="
                width: 36px; 
                height: 36px; 
                border-radius: 50%; 
                object-fit: cover;
              "
            />` :
            `<div style="
              font-size: 16px; 
              font-weight: bold; 
              color: #3b82f6;
            ">${company.customerName?.slice(0, 2).toUpperCase() || '📍'}</div>`
          }
        </div>
      `,
      className: 'custom-marker-logo',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      shadowUrl: '/leaflet/marker-shadow.png',
      shadowSize: [50, 50],
      shadowAnchor: [25, 50]
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
            icon={createCustomIcon(company, DivIcon)}
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

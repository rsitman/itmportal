'use client'

import { useState, useEffect, useRef } from 'react'
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
  onLocationClick?: (lat: number, lng: number) => void
  onMapReady?: (map: any) => void
  selectedProjectId?: string | null
  onMarkerClick?: (companyId: string) => void
}

export default function CompanyMap({
  companies,
  height = '400px',
  showControls = true,
  className = '',
  onLocationClick,
  onMapReady,
  selectedProjectId,
  onMarkerClick,
}: CompanyMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapComponents, setMapComponents] = useState<any>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const containerId = useRef(`map-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).current

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import leaflet only on client side
    Promise.all([
      import('leaflet')
    ]).then(([leaflet]) => {
      // Add custom CSS for logo markers: contain (no crop), dark surface
      if (typeof document !== 'undefined') {
        const style = document.createElement('style')
        style.textContent = `
          .custom-marker-logo {
            border-radius: 50% !important;
            background: rgba(31, 41, 55, 0.9) !important;
            border: 2px solid rgba(59, 130, 246, 0.6) !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          }
          .custom-marker-logo img {
            border-radius: 50% !important;
            object-fit: contain !important;
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

    // Cleanup function
    return () => {
      // Remove any existing map containers with this ID
      if (typeof document !== 'undefined') {
        const existingContainer = document.getElementById(containerId)
        if (existingContainer) {
          existingContainer.remove()
        }
      }
    }
  }, [containerId])
  const leafletReady = isClient && !!mapComponents

  // Create bounds to fit all markers
  const bounds =
    leafletReady && companies.length > 0
      ? new mapComponents.LatLngBounds(
          companies.map((company) => [company.latitude, company.longitude]),
        )
      : null

  // Calculate center and zoom for bounds
  const center = bounds ? bounds.getCenter() : [50.0755, 14.4378]
  const zoom = bounds ? 10 : 10

  // Marker fallback initials (no dependency on /logos/default.png)
  const markerInitials = (name: string | undefined) => {
    const s = (name ?? '').trim()
    if (!s) return '—'
    const parts = s.split(/[\s,]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
    return s.slice(0, 2).toUpperCase()
  }

  // Custom icons: contain (full logo visible), dark surface, fallback initials
  const createCustomIcon = (company: Company, DivIcon: any) => {
    const hasLogo = Boolean(company.logoBase64?.trim())
    const initials = markerInitials(company.customerName)

    return new DivIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(31, 41, 55, 0.9);
          border: 2px solid rgba(59, 130, 246, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${hasLogo
            ? `<img
                src="${company.logoBase64}"
                alt=""
                style="width: 32px; height: 32px; object-fit: contain; border-radius: 50%;"
              />`
            : `<span style="font-size: 14px; font-weight: 600; color: #d1d5db;">${initials}</span>`
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

  // React to externally selected project: center map and open popup
  useEffect(() => {
    if (!selectedProjectId || !mapRef.current) return
    const target = companies.find((c) => c.id === selectedProjectId)
    if (!target) return

    try {
      const mapInstance = mapRef.current as any
      if (typeof mapInstance.setView === 'function') {
        mapInstance.setView([target.latitude, target.longitude], mapInstance.getZoom?.() ?? 10)
      }
      const marker = markersRef.current[selectedProjectId]
      if (marker && typeof (marker as any).openPopup === 'function') {
        ;(marker as any).openPopup()
      }
    } catch (error) {
      logger.error('Error focusing on selected project in map:', error)
    }
  }, [selectedProjectId, companies])

  return (
    <div className={className} style={{ height }}>
      {!leafletReady ? (
        <div
          className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Načítání mapy...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          id={containerId}
          center={center as [number, number]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={(map) => {
            if (map) {
              mapRef.current = map
            }
            if (map && onMapReady) {
              try {
                onMapReady(map as any)

                // Fit bounds if available
                if (bounds) {
                  setTimeout(() => {
                    try {
                      if (map && typeof (map as any).fitBounds === 'function') {
                        (map as any).fitBounds(bounds, { padding: [50, 50] })
                      }
                    } catch (error) {
                      // console.warn('Failed to fit bounds:', error)
                    }
                  }, 500) // Increased delay
                }
              } catch (error) {
                // console.error('Error in map ref callback:', error)
              }
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {companies.map((company) => (
            <Marker
              key={company.id}
              position={[company.latitude, company.longitude]}
              icon={createCustomIcon(company, mapComponents.DivIcon)}
              ref={(marker) => {
                if (marker) {
                  markersRef.current[company.id] = marker
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(company.id)
                  }
                  if (onLocationClick) {
                    onLocationClick(company.latitude, company.longitude)
                  }
                },
              }}
            >
              <Popup>
                <div className="map-popup-content p-2">
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
                      <span className="inline-block bg-blue-100 text-green-800 text-xs px-2 py-1 rounded">
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
                      🌐{' '}
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-popup-link hover:underline"
                      >
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
      )}
    </div>
  )
}

'use client'

import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })

interface MapWrapperProps {
  children: React.ReactNode
  center?: [number, number]
  zoom?: number
  className?: string
  style?: React.CSSProperties
  onMapReady?: (map: any) => void
}

export default function MapWrapper({ 
  children, 
  center = [50.0755, 14.4378], 
  zoom = 10, 
  className = '', 
  style,
  onMapReady 
}: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && onMapReady) {
      // Import leaflet dynamically
      import('leaflet').then((L) => {
        // Try multiple ways to get the map instance
        const checkForMap = () => {
          // Method 1: Check for map instance on container
          const mapContainer = document.querySelector('.leaflet-container')
          if (mapContainer && (mapContainer as any)._leaflet_map) {
            // console.log('Found map instance via container')
            onMapReady((mapContainer as any)._leaflet_map)
            return
          }
          
          // Method 2: Check for map instance using data attribute
          const mapElement = document.querySelector('[data-leaflet="map"]') as any
          if (mapElement && mapElement._leaflet) {
            // console.log('Found map instance via data attribute')
            onMapReady(mapElement._leaflet)
            return
          }
          
          // Method 3: Check all leaflet containers
          const allContainers = document.querySelectorAll('.leaflet-container')
          allContainers.forEach((container, index) => {
            const containerAny = container as any
            if (containerAny._leaflet_map) {
              // console.log(`Found map instance via container ${index}`)
              onMapReady(containerAny._leaflet_map)
              return
            }
          })
          
          // If not found, try again after a delay
          setTimeout(checkForMap, 100)
        }
        
        checkForMap()
      })
    }
  }, [isClient, onMapReady])

  if (!isClient) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={style}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Načítání mapy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  )
}

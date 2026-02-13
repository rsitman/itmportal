'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)

interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  value: number
  color?: string
}

interface LeafletMapChartProps {
  title?: string
  data: MapPoint[]
  height?: number
  showLegend?: boolean
  className?: string
}

export default function LeafletMapChart({
  title,
  data,
  height = 400,
  showLegend = true,
  className = ''
}: LeafletMapChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)

  // Default center of Czech Republic
  const defaultCenter: [number, number] = [50.0755, 14.4378]
  const defaultZoom = 7

  const getColorByValue = (value: number) => {
    if (value > 80) return '#dc2626' // red-600
    if (value > 60) return '#f97316' // orange-500
    if (value > 40) return '#eab308' // yellow-500
    if (value > 20) return '#22c55e' // green-500
    return '#3b82f6' // blue-500
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="relative" style={{ height }}>
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Map points */}
          {data.map((point) => {
            const color = point.color || getColorByValue(point.value)
            const radius = Math.max(8, Math.min(25, point.value / 3))
            
            return (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={
                  L.div({
                    className: 'flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-xs',
                    style: {
                      backgroundColor: color,
                      width: `${radius * 2}px`,
                      height: `${radius * 2}px`,
                      border: '2px solid white'
                    }}
                  >
                    {point.value}
                  </L.div>
                }
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold">{point.name}</h4>
                    <p className="text-sm text-gray-600">
                      Hodnota: {point.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {point.lat.toFixed(4)}°N, {point.lng.toFixed(4)}°E
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        
        {/* Tooltip */}
        {selectedPoint && (
          <div
            className="absolute bg-white p-3 border border-gray-200 rounded-lg shadow-lg z-10"
            style={{
              left: '50%',
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <p className="text-sm font-medium text-gray-900">
              {selectedPoint.name}
            </p>
            <p className="text-sm text-gray-600">
              Hodnota: {selectedPoint.value}
            </p>
            <p className="text-xs text-gray-500">
              {selectedPoint.lat.toFixed(4)}°N, {selectedPoint.lng.toFixed(4)}°E
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">0-20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">21-40</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">41-60</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">61-80</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span className="text-gray-600">81-100</span>
          </div>
        </div>
      )}
    </div>
  )
}

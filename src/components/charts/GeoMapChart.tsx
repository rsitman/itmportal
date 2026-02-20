'use client'

import { useState } from 'react'

interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  value: number
  color?: string
}

interface GeoMapChartProps {
  title?: string
  data: MapPoint[]
  height?: number
  showLegend?: boolean
  className?: string
}

export default function GeoMapChart({
  title,
  data,
  height = 400,
  showLegend = true,
  className = ''
}: GeoMapChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)

  // Simplified but accurate SVG map of Czech Republic
  const czMapPath = "M 380 90 L 420 85 L 460 90 L 490 100 L 510 120 L 520 140 L 515 170 L 505 200 L 490 230 L 470 250 L 440 260 L 410 255 L 380 245 L 350 230 L 320 210 L 290 190 L 270 160 L 265 130 L 270 100 L 285 75 L 320 65 L 360 70 L 380 90 Z"

  // Czech regions with simplified but recognizable paths
  const regions = [
    {
      name: 'Hl. m. Praha',
      path: "M 475 155 L 485 150 L 490 155 L 485 165 L 475 160 L 470 155 Z",
      color: '#8b5cf6'
    },
    {
      name: 'Středočeský',
      path: "M 420 140 L 480 135 L 500 155 L 495 185 L 470 200 L 430 195 L 390 175 L 395 150 Z",
      color: '#3b82f6'
    },
    {
      name: 'Jihočeský',
      path: "M 320 200 L 380 195 L 400 215 L 395 235 L 370 240 L 330 230 L 300 210 L 310 190 Z",
      color: '#10b981'
    },
    {
      name: 'Plzeňský',
      path: "M 260 140 L 300 135 L 320 155 L 315 175 L 290 180 L 265 165 L 250 150 L 245 130 Z",
      color: '#f59e0b'
    },
    {
      name: 'Karlovarský',
      path: "M 220 120 L 260 115 L 280 135 L 275 155 L 250 160 L 225 145 L 215 130 Z",
      color: '#ef4444'
    },
    {
      name: 'Ústecký',
      path: "M 300 100 L 340 95 L 360 115 L 355 135 L 330 140 L 305 135 L 280 125 L 285 105 Z",
      color: '#ec4899'
    },
    {
      name: 'Liberecký',
      path: "M 370 95 L 410 90 L 430 110 L 425 130 L 400 135 L 370 130 L 340 120 L 335 100 Z",
      color: '#06b6d4'
    },
    {
      name: 'Královéhradecký',
      path: "M 410 125 L 450 120 L 470 140 L 465 160 L 440 165 L 410 160 L 380 150 L 375 130 Z",
      color: '#84cc16'
    },
    {
      name: 'Pardubický',
      path: "M 400 165 L 440 160 L 460 180 L 455 200 L 430 205 L 400 200 L 370 195 L 365 175 Z",
      color: '#a855f7'
    },
    {
      name: 'Vysočina',
      path: "M 350 180 L 390 175 L 410 195 L 405 215 L 380 220 L 350 215 L 320 205 L 325 185 Z",
      color: '#f97316'
    },
    {
      name: 'Jihomoravský',
      path: "M 360 210 L 400 205 L 420 225 L 415 245 L 390 250 L 360 245 L 330 235 L 335 215 Z",
      color: '#14b8a6'
    },
    {
      name: 'Olomoucký',
      path: "M 430 195 L 470 190 L 490 210 L 485 230 L 460 235 L 430 230 L 400 220 L 395 200 Z",
      color: '#e11d48'
    },
    {
      name: 'Zlínský',
      path: "M 460 215 L 500 210 L 520 230 L 515 250 L 490 255 L 460 250 L 430 240 L 425 220 Z",
      color: '#0ea5e9'
    },
    {
      name: 'Moravskoslezský',
      path: "M 470 235 L 510 230 L 530 250 L 525 270 L 500 275 L 470 270 L 440 265 L 415 245 Z",
      color: '#22c55e'
    }
  ]

  // Helper function to calculate center of a region from its path
  const getRegionCenter = (path: string) => {
    const numbers = path.match(/[\d.]+/g)?.map(Number) || []
    const xCoords = numbers.filter((_, i) => i % 2 === 0)
    const yCoords = numbers.filter((_, i) => i % 2 === 1)
    
    const centerX = xCoords.length > 0 ? Math.min(...xCoords) + (Math.max(...xCoords) - Math.min(...xCoords)) / 2 : 0
    const centerY = yCoords.length > 0 ? Math.min(...yCoords) + (Math.max(...yCoords) - Math.min(...yCoords)) / 2 : 0
    
    return { x: centerX, y: centerY }
  }

  // Scale coordinates to fit map
  const scaleCoordinates = (lat: number, lng: number) => {
    // Czech Republic approximate bounds
    const minLat = 48.55, maxLat = 51.06
    const minLng = 12.09, maxLng = 18.87
    
    // Map to SVG coordinates with better scaling
    const x = ((lng - minLng) / (maxLng - minLng)) * 400 + 150
    const y = ((maxLat - lat) / (maxLat - minLat)) * 250 + 50
    
    return { x, y }
  }

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
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 400"
          className="border border-gray-200 rounded"
        >
          {/* Czech Republic outline */}
          <path
            d={czMapPath}
            fill="#f9fafb"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          
          {/* Czech regions */}
          {regions.map((region, index) => (
            <g key={region.name}>
              <path
                d={region.path}
                fill={region.color}
                fillOpacity="0.3"
                stroke={region.color}
                strokeWidth="1"
                className="cursor-pointer hover:fill-opacity-50 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.fillOpacity = '0.6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.fillOpacity = '0.3'
                }}
              />
              <text
                x={getRegionCenter(region.path).x}
                y={getRegionCenter(region.path).y}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-600 pointer-events-none"
              >
                {region.name}
              </text>
            </g>
          ))}
          
          {/* Map points */}
          {data.map((point) => {
            const { x, y } = scaleCoordinates(point.lat, point.lng)
            const color = point.color || getColorByValue(point.value)
            const radius = Math.max(8, Math.min(25, point.value / 3))
            
            return (
              <g key={point.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  fillOpacity="0.9"
                  stroke="white"
                  strokeWidth="3"
                  className="cursor-pointer hover:fill-opacity-100 transition-all"
                  onMouseEnter={() => setSelectedPoint(point)}
                  onMouseLeave={() => setSelectedPoint(null)}
                />
                <text
                  x={x}
                  y={y - radius - 8}
                  textAnchor="middle"
                  className="text-sm font-semibold fill-gray-800 pointer-events-none"
                >
                  {point.name}
                </text>
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white pointer-events-none"
                >
                  {point.value}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* Tooltip */}
        {selectedPoint && (
          <div
            className="absolute bg-white p-3 border border-gray-200 rounded-lg shadow-lg z-10"
            style={{
              left: `${scaleCoordinates(selectedPoint.lat, selectedPoint.lng).x + 20}px`,
              top: `${scaleCoordinates(selectedPoint.lat, selectedPoint.lng).y - 40}px`
            }}
          >
            <p className="text-sm font-medium text-gray-900">
              {selectedPoint.name}
            </p>
            <p className="text-sm text-gray-600">
              Hodnota: {selectedPoint.value}
            </p>
            <p className="text-xs text-gray-500">
              {selectedPoint.lat.toFixed(2)}°N, {selectedPoint.lng.toFixed(2)}°E
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 space-y-3">
          {/* Point values legend */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Hodnoty bodů:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
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
          </div>
          
          {/* Regions legend */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Kraje ČR:</p>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 text-xs">
              {regions.map((region) => (
                <div key={region.name} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: region.color }}
                  ></div>
                  <span className="text-gray-600 truncate">{region.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

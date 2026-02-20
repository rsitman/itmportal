'use client'

import DataChart, { ChartSeries } from '@/components/charts/DataChart'
import GeoMapChart from '@/components/charts/GeoMapChart'

// Sample data for pie chart
const pieChartData: ChartSeries[] = [
  {
    name: 'Projekty podle statusu',
    data: [
      { x: 'Hotové', y: 45, label: 'Hotové projekty', color: '#10b981' },
      { x: 'V průběhu', y: 30, label: 'Projekty v průběhu', color: '#3b82f6' },
      { x: 'Plánované', y: 15, label: 'Plánované projekty', color: '#f59e0b' },
      { x: 'Pozastavené', y: 10, label: 'Pozastavené projekty', color: '#ef4444' }
    ]
  }
]

// Sample data for radar chart
const radarChartData: ChartSeries[] = [
  {
    name: 'Projekt Alpha',
    data: [
      { x: 'Rychlost', y: 95, label: 'Rychlost vývoje', color: '#3b82f6' },
      { x: 'Kvalita', y: 85, label: 'Kvalita kódu', color: '#3b82f6' },
      { x: 'Náklady', y: 45, label: 'Nákladová efektivita', color: '#3b82f6' },
      { x: 'Tým', y: 90, label: 'Týmová spolupráce', color: '#3b82f6' },
      { x: 'Inovace', y: 88, label: 'Inovativní řešení', color: '#3b82f6' },
      { x: 'Dokumentace', y: 35, label: 'Kvalita dokumentace', color: '#3b82f6' }
    ]
  },
  {
    name: 'Projekt Beta',
    data: [
      { x: 'Rychlost', y: 55, label: 'Rychlost vývoje', color: '#ef4444' },
      { x: 'Kvalita', y: 92, label: 'Kvalita kódu', color: '#ef4444' },
      { x: 'Náklady', y: 85, label: 'Nákladová efektivita', color: '#ef4444' },
      { x: 'Tým', y: 60, label: 'Týmová spolupráce', color: '#ef4444' },
      { x: 'Inovace', y: 40, label: 'Inovativní řešení', color: '#ef4444' },
      { x: 'Dokumentace', y: 95, label: 'Kvalita dokumentace', color: '#ef4444' }
    ]
  },
  {
    name: 'Projekt Gamma',
    data: [
      { x: 'Rychlost', y: 70, label: 'Rychlost vývoje', color: '#10b981' },
      { x: 'Kvalita', y: 75, label: 'Kvalita kódu', color: '#10b981' },
      { x: 'Náklady', y: 78, label: 'Nákladová efektivita', color: '#10b981' },
      { x: 'Tým', y: 85, label: 'Týmová spolupráce', color: '#10b981' },
      { x: 'Inovace', y: 65, label: 'Inovativní řešení', color: '#10b981' },
      { x: 'Dokumentace', y: 72, label: 'Kvalita dokumentace', color: '#10b981' }
    ]
  }
]
// Sample data for stacked bar chart
const stackedBarChartData: ChartSeries[] = [
  {
    name: 'Hotové',
    data: [
      { x: 'Leden', y: 15, color: '#10b981' },
      { x: 'Únor', y: 18, color: '#10b981' },
      { x: 'Březen', y: 22, color: '#10b981' },
      { x: 'Duben', y: 25, color: '#10b981' },
      { x: 'Květen', y: 28, color: '#10b981' }
    ]
  },
  {
    name: 'V průběhu',
    data: [
      { x: 'Leden', y: 25, color: '#3b82f6' },
      { x: 'Únor', y: 30, color: '#3b82f6' },
      { x: 'Březen', y: 28, color: '#3b82f6' },
      { x: 'Duben', y: 35, color: '#3b82f6' },
      { x: 'Květen', y: 32, color: '#3b82f6' }
    ]
  },
  {
    name: 'Plánované',
    data: [
      { x: 'Leden', y: 10, color: '#f59e0b' },
      { x: 'Únor', y: 12, color: '#f59e0b' },
      { x: 'Březen', y: 15, color: '#f59e0b' },
      { x: 'Duben', y: 8, color: '#f59e0b' },
      { x: 'Květen', y: 10, color: '#f59e0b' }
    ]
  }
]

// Sample data for scatter chart (correlation)
const scatterChartData: ChartSeries[] = [
  {
    name: 'Projekt A',
    data: [
      { x: 10, y: 85, color: '#3b82f6' },   // Náklady vs Kvalita
      { x: 25, y: 92, color: '#3b82f6' },
      { x: 15, y: 78, color: '#3b82f6' },
      { x: 30, y: 95, color: '#3b82f6' },
      { x: 20, y: 88, color: '#3b82f6' },
      { x: 35, y: 98, color: '#3b82f6' }
    ]
  },
  {
    name: 'Projekt B',
    data: [
      { x: 45, y: 65, color: '#ef4444' },  // Vyšší náklady, nižší kvalita
      { x: 60, y: 72, color: '#ef4444' },
      { x: 50, y: 68, color: '#ef4444' },
      { x: 70, y: 75, color: '#ef4444' },
      { x: 55, y: 70, color: '#ef4444' },
      { x: 80, y: 82, color: '#ef4444' }
    ]
  },
  {
    name: 'Projekt C',
    data: [
      { x: 40, y: 88, color: '#10b981' },  // Vyvážený poměr
      { x: 42, y: 90, color: '#10b981' },
      { x: 38, y: 85, color: '#10b981' },
      { x: 45, y: 92, color: '#10b981' },
      { x: 41, y: 87, color: '#10b981' },
      { x: 44, y: 91, color: '#10b981' }
    ]
  }
]

const barChartData: ChartSeries[] = [
  {
    name: 'Počet úkolů',
    data: [
      { x: 'Pondělí', y: 12 },
      { x: 'Úterý', y: 19 },
      { x: 'Středa', y: 15 },
      { x: 'Čtvrtek', y: 25 },
      { x: 'Pátek', y: 22 }
    ]
  }
]

// Sample data for geographic map
const geoMapData = [
  { id: '1', name: 'Praha', lat: 50.0755, lng: 14.4378, value: 95 },
  { id: '2', name: 'Brno', lat: 49.1951, lng: 16.6070, value: 78 },
  { id: '3', name: 'Ostrava', lat: 49.8209, lng: 18.2625, value: 62 },
  { id: '4', name: 'Plzeň', lat: 49.7384, lng: 13.3736, value: 45 },
  { id: '5', name: 'Liberec', lat: 50.7662, lng: 15.0543, value: 38 },
  { id: '6', name: 'Olomouc', lat: 49.5938, lng: 17.2508, value: 55 },
  { id: '7', name: 'České Budějovice', lat: 48.9745, lng: 14.4745, value: 42 },
  { id: '8', name: 'Hradec Králové', lat: 50.2092, lng: 15.8328, value: 35 }
]

// Map type state
type MapType = 'svg' | 'leaflet'

import { useState } from 'react';

export default function TestPieChartPage() {
  const [mapType, setMapType] = useState<MapType>('svg')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Grafů</h1>
        
        {/* Map Type Switcher */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-gray-700">Typ mapy:</span>
            <button
              onClick={() => setMapType('svg')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mapType === 'svg' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              SVG mapa
            </button>
            <button
              onClick={() => setMapType('leaflet')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mapType === 'leaflet' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Leaflet mapa
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scatter Chart */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Bodový graf (korelace)</h2>
            <DataChart
              type="scatter"
              data={scatterChartData}
              title="Náklady vs Kvalita (korelační analýza)"
              height={400}
              showLegend={true}
              xAxisLabel="Náklady (tis. Kč)"
              yAxisLabel="Kvalita (%)"
            />
          </div>

          {/* Pie Chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Koláčový graf</h2>
            <DataChart
              type="pie"
              data={pieChartData}
              title="Projekty podle statusu"
              height={300}
              showLegend={true}
            />
          </div>

          {/* Radar Chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pavoučí graf</h2>
            <DataChart
              type="radar"
              data={radarChartData}
              title="Porovnání 3 projektů (vyrovnanost vs specializace)"
              height={300}
              showLegend={true}
            />
          </div>

          {/* Stacked Bar Chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Kumulovaný sloupcový</h2>
            <DataChart
              type="stacked-bar"
              data={stackedBarChartData}
              title="Projekty podle měsíců (kumulace)"
              height={300}
              showLegend={true}
              xAxisLabel="Měsíc"
              yAxisLabel="Počet projektů"
            />
          </div>

          {/* Bar Chart */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sloupcový graf</h2>
            <DataChart
              type="bar"
              data={barChartData}
              title="Počet úkolů v týdnu"
              height={300}
              showLegend={true}
              xAxisLabel="Den"
              yAxisLabel="Počet úkolů"
            />
          </div>

          {/* Geographic Map */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Geografická mapa</h2>
            <GeoMapChart
              data={geoMapData}
              title="Projekty podle lokalit v ČR"
              height={350}
              showLegend={true}
            />
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Příklad použití</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import DataChart, { ChartSeries } from '@/components/charts/DataChart'

const pieData: ChartSeries[] = [
  {
    name: 'Data',
    data: [
      { x: 'Kategorie 1', y: 45, label: 'Popis 1', color: '#3b82f6' },
      { x: 'Kategorie 2', y: 30, label: 'Popis 2', color: '#ef4444' },
      { x: 'Kategorie 3', y: 25, label: 'Popis 3', color: '#10b981' }
    ]
  }
]

<DataChart
  type="pie"
  data={pieData}
  title="Můj koláčový graf"
  height={300}
  showLegend={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}

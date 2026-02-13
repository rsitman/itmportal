'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { ChartSeries, ChartType } from './charts/DataChart'
import DataChart from './charts/DataChart'

interface DatabaseDetailRowProps {
  database: Database
  isOpen: boolean
  onToggle: () => void
}

export default function DatabaseDetailRow({ database, isOpen, onToggle }: DatabaseDetailRowProps) {
  const [chartData, setChartData] = useState<{ db: any[], log: any[] }>({ db: [], log: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<ChartType>('line')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dní zpět
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isOpen) {
      fetchChartData()
    }
  }, [isOpen, dateRange])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('projekt', database.projekt)
      params.append('database', database.databaze)
      params.append('startDate', dateRange.start)
      params.append('endDate', dateRange.end)
      
      console.log('Fetching chart data with params:', params.toString())
      const response = await fetch(`/api/database-chart?${params}`)
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText)
        throw new Error(`Failed to fetch chart data: ${response.status}`)
      }
      
      const chartData = await response.json()
      
      console.log('API response data:', chartData)
      
      // Rozdělení dat na DB a Log - využití se bere přímo z API v MB
      const dbChartData = chartData.data.filter((series: any) => series.name.includes('DB'))
      const logChartData = chartData.data.filter((series: any) => series.name.includes('Log'))
      
      console.log('DB chart data:', dbChartData)
      console.log('Log chart data:', logChartData)
      
      setChartData({ 
        db: dbChartData, 
        log: logChartData
      })
    } catch (error: any) {
      console.error('Chyba při načítání dat grafu:', error)
      setError(error)
      // Nastavíme prázdná data, aby se graf nezobrazoval s chybou
      setChartData({ db: [], log: [] })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.append('projekt', database.projekt)
      params.append('database', database.databaze)
      params.append('startDate', dateRange.start)
      params.append('endDate', dateRange.end)
      params.append('format', 'csv')
      
      const response = await fetch(`/api/database-chart/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export selhal')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${database.databaze}_chart_${dateRange.start}_${dateRange.end}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export selhal. Zkuste to prosím znovu.')
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="bg-gray-50 border-l-4 border-blue-500">
      <div className="p-6">
        {/* Header s informacemi o databázi */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {database.firma_nazev} - {database.databaze}
            </h3>
            <p className="text-sm text-gray-600">
              Projekt: {database.projekt} | Verze: {database.verze}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ovládací prvky grafu */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Typ grafu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ grafu
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="line">Čárový</option>
                  <option value="bar">Sloupcový</option>
                  <option value="area">Plošný</option>
                </select>
              </div>

              {/* Datum od */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Od
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Datum do */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Akce */}
            <div className="flex gap-2">
              <button
                onClick={fetchChartData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Obnovit
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Grafy - dva samostatné */}
        {loading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Chyba při načítání grafů</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Graf pro databázový soubor */}
            <DataChart
              title={`Vývoj databázového souboru ${database.databaze}`}
              type={chartType}
              data={chartData.db}
              height={350}
              showLegend={true}
              showGrid={true}
              xAxisLabel="Datum"
              yAxisLabel="Velikost (MB)"
            />
            
            {/* Graf pro log soubor */}
            <DataChart
              title={`Vývoj log souboru ${database.databaze}`}
              type={chartType}
              data={chartData.log}
              height={350}
              showLegend={true}
              showGrid={true}
              xAxisLabel="Datum"
              yAxisLabel="Velikost (MB)"
            />
          </div>
        )}

        {/* Statistiky */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Současná velikost</h4>
            <p className="text-xl font-bold text-gray-900">{database.velikost.toLocaleString()} MB</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Volné místo</h4>
            <p className="text-xl font-bold text-green-600">{database.velikost_volne.toLocaleString()} MB</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Využití</h4>
            <p className="text-xl font-bold text-blue-600">
              {Math.round((database.velikost - database.velikost_volne) / database.velikost_max * 100)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Denní nárůst</h4>
            <p className="text-xl font-bold text-orange-600">{database.denni_narust_mb} MB</p>
          </div>
        </div>
        {chartData.db.length === 0 && chartData.log.length === 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-blue-800">Žádná historická data</h3>
            <p className="mt-1 text-sm text-blue-700">
              Pro databázi {database.databaze} a projekt {database.projekt} nebyla nalezena žádná historická data v období od {dateRange.start} do {dateRange.end}.
            </p>
            <p className="mt-2 text-xs text-blue-600">
              Možné příčiny: Databáze v tomto období ještě neexistovala, data nejsou dostupná, nebo zvolené příliš staré období.
            </p>
          </div>
        )}
      </div>
      <button
        onClick={onToggle}
        className="text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Ovládací prvky grafu */}
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Typ grafu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ grafu
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="line">Čárový</option>
              <option value="bar">Sloupcový</option>
              <option value="area">Plošný</option>
            </select>
          </div>

          {/* Datum od */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Od
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Datum do */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Do
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Akce */}
        <div className="flex gap-2">
          <button
            onClick={fetchChartData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Obnovit
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>

    {/* Grafy - dva samostatné */}
    {loading ? (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ) : error ? (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Chyba při načítání grafů</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div>
        {/* Graf pro databázový soubor */}
        <DataChart
          title={`Vývoj databázového souboru ${database.databaze}`}
          type={chartType}
          data={chartData.db}
          height={350}
          showLegend={true}
          showGrid={true}
          xAxisLabel="Datum"
          yAxisLabel="Velikost (MB)"
        />
        
        {/* Graf pro log soubor */}
        <DataChart
          title={`Vývoj log souboru ${database.databaze}`}
          type={chartType}
          data={chartData.log}
          height={350}
          showLegend={true}
          showGrid={true}
          xAxisLabel="Datum"
          yAxisLabel="Velikost (MB)"
        />
      </div>
    )}

    {/* Statistiky */}
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Současná velikost</h4>
        <p className="text-xl font-bold text-gray-900">{database.velikost.toLocaleString()} MB</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Volné místo</h4>
        <p className="text-xl font-bold text-green-600">{database.velikost_volne.toLocaleString()} MB</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Využití</h4>
        <p className="text-xl font-bold text-blue-600">
          {Math.round((database.velikost - database.velikost_volne) / database.velikost_max * 100)}%
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Denní nárůst</h4>
        <p className="text-xl font-bold text-orange-600">{database.denni_narust_mb} MB</p>
      </div>
    </div>
    {chartData.db.length === 0 && chartData.log.length === 0 && (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-blue-800">Žádná historická data</h3>
        <p className="mt-1 text-sm text-blue-700">
          Pro databázi {database.databaze} a projekt {database.projekt} nebyla nalezena žádná historická data v období od {dateRange.start} do {dateRange.end}.
        </p>
        <p className="mt-2 text-xs text-blue-600">
          Možné příčiny: Databáze v tomto období ještě neexistovala, data nejsou dostupná, nebo zvolené příliš staré období.
        </p>
      </div>
    )}
  </div>
</div>
)

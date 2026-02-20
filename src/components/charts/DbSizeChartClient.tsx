'use client'

import { useState, useEffect } from 'react'
import DataChart, { ChartSeries, ChartType } from './DataChart'
import { logger } from '@/lib/logger'

interface DbSizeData {
  data: ChartSeries[]
  metadata: {
    companies: string[]
    totalRecords: number
    dateRange: {
      start: Date | null
      end: Date | null
    }
  }
}

export default function DbSizeChartClient() {
  const [data, setData] = useState<DbSizeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<ChartType>('line')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: '2026-01-01',
    end: '2026-01-31'
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (selectedCompany !== 'all') {
          params.append('company', selectedCompany)
        }
        params.append('startDate', dateRange.start)
        params.append('endDate', dateRange.end)
        
        const response = await fetch(`/api/charts/db-size?${params}`)
        
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError('Nepodařilo se načíst data')
        }
      } catch (error) {
        logger.error('Error fetching chart data:', error)
        setError('Došlo k chybě při načítání dat')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCompany, dateRange])

  if (loading) {
    return (
      <div className="px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Chyba</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-6">
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Žádná data
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Pro zadané parametry nebyla nalezena žádná data.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Chart Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ grafu
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-green-500"
              >
                <option value="line">Čárový</option>
                <option value="bar">Sloupcový</option>
                <option value="stacked-bar">Kumulovaný sloupcový</option>
                <option value="area">Plošný</option>
                <option value="pie">Koláčový</option>
                <option value="radar">Pavoučí</option>
                <option value="scatter">Bodový (korelace)</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firma
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-green-500"
              >
                <option value="all">Všechny firmy</option>
                {data.metadata.companies.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Od
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Do
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Obnovit data
          </button>
        </div>
      </div>

      {/* Chart */}
      <DataChart
        title="Velikost databází v čase"
        type={chartType}
        data={data.data}
        width={1200}
        height={500}
        showLegend={selectedCompany === 'all'}
        showGrid={true}
        xAxisLabel="Datum"
        yAxisLabel="Velikost (MB)"
      />

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Celkem záznamů</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.totalRecords.toLocaleString('cs-CZ')}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Počet firem</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.metadata.companies.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Data rozsah</h3>
          <p className="text-sm text-gray-900">
            {data.metadata.dateRange.start && data.metadata.dateRange.end
              ? `${new Date(data.metadata.dateRange.start).toLocaleDateString('cs-CZ')} - ${new Date(data.metadata.dateRange.end).toLocaleDateString('cs-CZ')}`
              : '—'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

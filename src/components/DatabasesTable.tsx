'use client'

import { Fragment, useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { DatabaseService } from '@/lib/database-service'
import DbSizeChartClient from '@/components/charts/DbSizeChartClient'
import DataChart from '@/components/charts/DataChart'

interface DatabasesTableProps {
  databases: Database[]
}

// Wrapper component to pass company filter to DbSizeChartClient
function DbSizeChartClientWrapper({ companyName }: { companyName: string }) {
  return (
    <div style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%', height: '111%' }}>
      <DbSizeChartClientWithCompanyFilter companyName={companyName} />
    </div>
  )
}

// Modified chart client that accepts company prop
function DbSizeChartClientWithCompanyFilter({ companyName }: { companyName: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area') // Default to area chart

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // console.log(`🔍 Fetching chart data for company: ${companyName}`)
        const params = new URLSearchParams()
        params.append('company', companyName)
        params.append('startDate', '2026-01-01')
        params.append('endDate', '2026-01-31')
        
        const response = await fetch(`/api/charts/db-size?${params}`)
        // console.log(`📊 Chart response status: ${response.status}`)
        
        if (response.ok) {
          const result = await response.json()
          // console.log(`📊 Chart data received:`, result)
          // console.log(`📊 MDF data:`, result.mdfData)
          // console.log(`📊 LDF data:`, result.ldfData)
          setData(result)
        } else {
          const errorText = await response.text()
          // console.error(`📊 Chart error response:`, errorText)
          setError('Nepodařilo se načíst data')
        }
      } catch (error) {
        // console.error('Error fetching chart data:', error)
        setError('Došlo k chybě při načítání dat')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyName])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (!data || !data.mdfData || !data.ldfData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žádná data</h3>
          <p className="mt-1 text-sm text-gray-500">Pro firmu {companyName} nebyla nalezena žádná data.</p>
        </div>
      </div>
    )
  }

  // console.log(`🎨 Rendering charts for ${companyName}, MDF series:`, data.mdfData.length, 'LDF series:', data.ldfData.length)

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">Graf velikosti databáze</h4>
          <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                chartType === 'area' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Plošný
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                chartType === 'line' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Čárový
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                chartType === 'bar' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Sloupcový
            </button>
          </div>
        </div>
      </div>
      
      {/* MDF Chart */}
      <div className="mb-8">
        <h5 className="text-sm font-medium text-gray-600 mb-2">MDF (Data) soubory</h5>
        <DataChart
          title={`MDF velikosti: ${companyName}`}
          type={chartType}
          data={data?.mdfData || []}
          width={800}
          height={300}
          showLegend={true}
          showGrid={true}
          xAxisLabel="Datum"
          yAxisLabel="Velikost (MB)"
        />
      </div>
      
      {/* LDF Chart */}
      <div>
        <h5 className="text-sm font-medium text-gray-600 mb-2">LDF (Log) soubory</h5>
        <DataChart
          title={`LDF velikosti: ${companyName}`}
          type={chartType}
          data={data?.ldfData || []}
          width={800}
          height={300}
          showLegend={true}
          showGrid={true}
          xAxisLabel="Datum"
          yAxisLabel="Velikost (MB)"
        />
      </div>
    </div>
  )
}

export default function DatabasesTable({ databases }: DatabasesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  if (databases.length === 0) {
    return (
      <div className="text-center py-16 card-professional rounded-xl">
        <div className="text-gray-400 text-6xl mb-4">🗄️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Žádné databáze</h3>
        <p className="text-gray-300">Nebyly nalezeny žádné databáze k zobrazení.</p>
      </div>
    )
  }

  return (
    <div className="card-professional rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="flex border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <div className="px-6 py-4 border-r border-gray-700 flex-1 min-w-[120px]">Firma</div>
            <div className="px-6 py-4 border-r border-gray-700 flex-1 min-w-[100px]">Projekt</div>
            <div className="px-6 py-4 border-r border-gray-700 flex-1 min-w-[100px]">Databáze</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[100px] flex-shrink-0">Verze</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[120px] flex-shrink-0">Velikost</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[120px] flex-shrink-0">Využití</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[120px] flex-shrink-0">Log velikost</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[120px] flex-shrink-0">Log využití</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[100px] flex-shrink-0">Volné dny</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[180px] flex-shrink-0">Poslední Full backup</div>
            <div className="px-6 py-4 border-r border-gray-700 w-[180px] flex-shrink-0">Poslední Inc backup</div>
            <div className="px-6 py-4 w-[100px] flex-shrink-0">Recovery</div>
          </div>
        
        {/* Data rows */}
        {databases.map((database, index) => {
          const rowKey = `${database.projekt}-${database.databaze}-${index}`
          const isExpanded = expandedRows.has(rowKey)
          const usagePercentage = DatabaseService.calculateUsagePercentage(
            database.velikost - database.velikost_volne, 
            database.velikost_max
          )
          const logUsagePercentage = DatabaseService.calculateUsagePercentage(
            database.velikost_log - database.velikost_log_volne, 
            database.velikost_log_max
          )
          
          const toggleRow = () => {
            const newExpanded = new Set(expandedRows)
            if (isExpanded) {
              newExpanded.delete(rowKey)
            } else {
              newExpanded.add(rowKey)
            }
            setExpandedRows(newExpanded)
          }

          return (
            <Fragment key={rowKey}>
              <div 
                className="flex border-b border-gray-700 hover:bg-gray-800 flex-shrink-0 cursor-pointer"
                onClick={toggleRow}
              >
                {/* Company */}
                <div className="px-4 py-3 text-sm font-medium text-white flex-1 min-w-[120px] overflow-hidden flex items-center">
                  <svg 
                    className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="truncate" title={database.firma_nazev}>
                    {database.firma_nazev}
                  </div>
                </div>
                
                {/* Project */}
                <div className="px-4 py-3 text-sm text-gray-900 flex-1 min-w-[100px] overflow-hidden">
                  <div className="truncate" title={database.projekt}>
                    {database.projekt}
                  </div>
                </div>
                
                {/* Database */}
                <div className="px-4 py-3 text-sm text-gray-900 flex-1 min-w-[100px] overflow-hidden">
                  <div className="truncate" title={database.databaze}>
                    {database.databaze}
                  </div>
                </div>
                
                {/* Version */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[100px] flex-shrink-0">
                  {database.verze}
                </div>
                
                {/* Size */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[120px] flex-shrink-0">
                  <div>{DatabaseService.formatSize(database.velikost)}</div>
                  <div className="text-xs text-gray-500">z {DatabaseService.formatSize(database.velikost_max)}</div>
                </div>
                
                {/* Usage */}
                <div className="px-4 py-3 whitespace-nowrap w-[120px] flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getUsageColor(usagePercentage)}`}>
                    {usagePercentage}%
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {DatabaseService.formatSize(database.velikost_volne)} volné
                  </div>
                </div>
                
                {/* Log Size */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[120px] flex-shrink-0">
                  <div>{DatabaseService.formatSize(database.velikost_log)}</div>
                  <div className="text-xs text-gray-500">z {DatabaseService.formatSize(database.velikost_log_max)}</div>
                </div>
                
                {/* Log Usage */}
                <div className="px-4 py-3 whitespace-nowrap w-[120px] flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getLogUsageColor(logUsagePercentage)}`}>
                    {logUsagePercentage}%
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {DatabaseService.formatSize(database.velikost_log_volne)} volné
                  </div>
                </div>
                
                {/* Days Remaining */}
                <div className="px-4 py-3 whitespace-nowrap w-[100px] flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${DatabaseService.getDaysRemainingColor(database.volne_zbyva_dni)}`}>
                    {database.volne_zbyva_dni} dní
                  </span>
                </div>
                
                {/* Last Full Backup */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[180px] flex-shrink-0">
                  <div>{DatabaseService.formatDate(database.backup_full)}</div>
                </div>
                
                {/* Last Inc Backup */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[180px] flex-shrink-0">
                  <div>{DatabaseService.formatDate(database.backup_inc)}</div>
                </div>
                
                {/* Recovery Model */}
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 w-[100px] flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    database.recovery_model === 'FULL' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {database.recovery_model}
                  </span>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="bg-gray-900/50 border-l-4 border-green-500">
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Graf velikosti databáze: {database.firma_nazev}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Projekt: {database.projekt} | Databáze: {database.databaze}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <DbSizeChartClientWrapper 
                        companyName={database.firma_nazev}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { Fragment, useState } from 'react'
import { Database } from '@/types/database'
import { DatabaseService } from '@/lib/database-service'

interface DatabasesTableProps {
  databases: Database[]
}

export default function DatabasesTable({ databases }: DatabasesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  if (databases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🗄️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné databáze</h3>
        <p className="text-gray-600">Nebyly nalezeny žádné databáze k zobrazení.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1600px]">
        {/* Header */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
          <div className="px-4 py-3 border-r border-gray-200 flex-1 min-w-[120px]">Firma</div>
          <div className="px-4 py-3 border-r border-gray-200 flex-1 min-w-[100px]">Projekt</div>
          <div className="px-4 py-3 border-r border-gray-200 flex-1 min-w-[100px]">Databáze</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[100px] flex-shrink-0">Verze</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Velikost</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Využití</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Log velikost</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Log využití</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[100px] flex-shrink-0">Volné dny</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[180px] flex-shrink-0">Poslední Full backup</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[180px] flex-shrink-0">Poslední Inc backup</div>
          <div className="px-4 py-3 w-[100px] flex-shrink-0">Recovery</div>
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
                className="flex border-b border-gray-100 hover:bg-gray-50 flex-shrink-0 cursor-pointer"
                onClick={toggleRow}
              >
                {/* Company */}
                <div className="px-4 py-3 text-sm font-medium text-gray-900 flex-1 min-w-[120px] overflow-hidden flex items-center">
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
                <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[100px] flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    database.recovery_model === 'FULL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {database.recovery_model}
                  </span>
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

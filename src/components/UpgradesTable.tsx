'use client'

import { Fragment } from 'react'
import { Upgrade } from '@/types/upgrade'
import { UpgradeService } from '@/lib/upgrade-service'

interface UpgradesTableProps {
  upgrades: Upgrade[]
}

export default function UpgradesTable({ upgrades }: UpgradesTableProps) {
  if (upgrades.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné upgrady</h3>
        <p className="text-gray-600">Nebyly nalezeny žádné upgrady k zobrazení.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Projekt</div>
          <div className="px-6 py-3 border-r border-gray-200 w-[300px] flex-shrink-0">Název</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[100px] flex-shrink-0">Verze</div>
          <div className="px-6 py-3 border-r border-gray-200 w-[180px] flex-shrink-0">Datum od</div>
          <div className="px-6 py-3 border-r border-gray-200 w-[180px] flex-shrink-0">Datum do</div>
          <div className="px-6 py-3 border-r border-gray-200 w-[200px] flex-shrink-0">Řešitel</div>
          <div className="px-6 py-3 border-r border-gray-200 w-[150px] flex-shrink-0">JIRA klíč</div>
          <div className="px-4 py-3 border-r border-gray-200 w-[120px] flex-shrink-0">Stav</div>
        </div>
        
        {/* Data rows */}
        {upgrades.map((upgrade, index) => (
          <Fragment key={`${upgrade.projekt}-${index}`}>
            <div className="flex border-b border-gray-100 hover:bg-gray-50 flex-shrink-0">
              {/* Project */}
              <div className="px-4 py-3 text-sm font-medium text-gray-900 w-[120px] flex-shrink-0 overflow-hidden">
                <div className="truncate" title={upgrade.projekt}>
                  {upgrade.projekt}
                </div>
              </div>
              
              {/* Name */}
              <div className="px-6 py-3 text-sm text-gray-900 w-[300px] flex-shrink-0 overflow-hidden">
                <div className="truncate" title={upgrade.nazev}>
                  {upgrade.nazev}
                </div>
              </div>
              
              {/* Version */}
              <div className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 w-[100px] flex-shrink-0">
                {upgrade.verze}
              </div>
              
              {/* Date From */}
              <div className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 w-[180px] flex-shrink-0">
                <div>{UpgradeService.formatDate(upgrade.datum_od)}</div>
              </div>
              
              {/* Date To */}
              <div className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 w-[180px] flex-shrink-0">
                <div>
                  {upgrade.datum_do && upgrade.datum_do !== upgrade.datum_od ? (
                    <div>{UpgradeService.formatDate(upgrade.datum_do)}</div>
                  ) : (
                    <div className="text-gray-400">—</div>
                  )}
                </div>
              </div>
              
              {/* Resolver */}
              <div className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 w-[200px] flex-shrink-0">
                <div className="truncate" title={upgrade.resitel}>
                  {upgrade.resitel}
                </div>
              </div>
              
              {/* JIRA */}
              <div className="px-6 py-3 whitespace-nowrap text-sm border-b border-gray-100 w-[150px] flex-shrink-0">
                <a href={`https://your-jira-instance.com/browse/${upgrade.jira_klic}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 hover:underline font-mono text-xs block">{upgrade.jira_klic}</a>
              </div>
              
              {/* Status */}
              <div className="px-4 py-3 whitespace-nowrap w-[120px] flex-shrink-0">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${UpgradeService.getStatusColor(upgrade.stav)}`}>
                  {upgrade.stav}
                </span>
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

'use client'

import { Fragment } from 'react'
import { Upgrade } from '@/types/upgrade'
import { UpgradeService } from '@/lib/upgrade-service'

interface UpgradesTableProps {
  upgrades: Upgrade[]
}

export default function UpgradesTable({ upgrades }: UpgradesTableProps) {
        // DEBUG: Remove in production
        // console.log('UpgradesTable - received data:', upgrades);
        // console.log('UpgradesTable - data length:', upgrades.length);
  
  if (upgrades.length > 0) {
    // DEBUG: Remove in production
    // console.log('UpgradesTable - first upgrade:', upgrades[0]);
    // console.log('UpgradesTable - first upgrade status:', upgrades[0].stav);
    // console.log('UpgradesTable - status type:', typeof upgrades[0].stav);
    // console.log('UpgradesTable - status lowercased:', upgrades[0].stav?.toLowerCase());
  }

  // DEBUG: Add test data if no real data
  const testData: Upgrade[] = [
    {
      projekt: 'TEST001',
      nazev: 'Test Upgrade - Realizováno',
      verze: '1.0.0',
      datum_od: '2025-01-01',
      datum_do: '2025-01-02',
      resitel: 'Test User',
      jira_klic: 'TEST-123',
      stav: 'realizováno'
    },
    {
      projekt: 'TEST002', 
      nazev: 'Test Upgrade - V přípravě',
      verze: '2.0.0',
      datum_od: '2025-02-01',
      datum_do: '2025-02-02',
      resitel: 'Test User 2',
      jira_klic: 'TEST-456',
      stav: 'v přípravě'
    }
  ];

  const displayData = upgrades.length > 0 ? upgrades : testData;

  if (displayData.length === 0) {
    return (
      <div className="text-center py-16 card-professional rounded-xl">
        <div className="text-gray-400 text-6xl mb-4">�</div>
        <h3 className="text-lg font-medium text-white mb-2">Žádné upgrady</h3>
        <p className="text-gray-300">Nebyly nalezeny žádné upgrady k zobrazení.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="flex border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 text-xs font-medium text-gray-300">
          <div className="px-4 py-3 border-r border-gray-700 w-[180px] flex-shrink-0">Projekt</div>
          <div className="px-6 py-3 border-r border-gray-700 flex-grow min-w-[300px]">Název</div>
          <div className="px-4 py-3 border-r border-gray-700 w-[100px] flex-shrink-0">Verze</div>
          <div className="px-6 py-3 border-r border-gray-700 w-[180px] flex-shrink-0">Datum od</div>
          <div className="px-6 py-3 border-r border-gray-700 w-[180px] flex-shrink-0">Datum do</div>
          <div className="px-6 py-3 border-r border-gray-700 w-[200px] flex-shrink-0">Řešitel</div>
          <div className="px-6 py-3 border-r border-gray-700 w-[150px] flex-shrink-0">JIRA klíč</div>
          <div className="px-4 py-3 border-r border-gray-700 w-[120px] flex-shrink-0">Stav</div>
        </div>
        
        {/* Data rows */}
        {displayData.map((upgrade, index) => (
          <Fragment key={`${upgrade.projekt}-${index}`}>
            <div className="flex border-b border-gray-700 hover:bg-gray-800 flex-shrink-0">
              {/* Project */}
              <div className="px-4 py-3 text-sm font-medium text-white w-[180px] flex-shrink-0">
                <div className="truncate" title={upgrade.projekt}>
                  {upgrade.projekt}
                </div>
              </div>
              
              {/* Name */}
              <div className="px-6 py-3 text-sm text-gray-300 flex-grow min-w-[300px]">
                <div className="whitespace-normal" title={upgrade.nazev}>
                  {upgrade.nazev}
                </div>
              </div>
              
              {/* Version */}
              <div className="px-4 py-3 text-sm text-gray-300 w-[100px] flex-shrink-0">
                {upgrade.verze}
              </div>
              
              {/* Date From */}
              <div className="px-6 py-3 text-sm text-gray-300 w-[180px] flex-shrink-0">
                <div>{UpgradeService.formatDate(upgrade.datum_od)}</div>
              </div>
              
              {/* Date To */}
              <div className="px-6 py-3 text-sm text-gray-300 w-[180px] flex-shrink-0">
                <div>
                  {upgrade.datum_do && upgrade.datum_do !== upgrade.datum_od ? (
                    <div>{UpgradeService.formatDate(upgrade.datum_do)}</div>
                  ) : (
                    <div className="text-gray-500">—</div>
                  )}
                </div>
              </div>
              
              {/* Resolver */}
              <div className="px-6 py-3 text-sm text-gray-300 w-[200px] flex-shrink-0">
                <div className="truncate" title={upgrade.resitel}>
                  {upgrade.resitel}
                </div>
              </div>
              
              {/* JIRA */}
              <div className="px-6 py-3 text-sm border-b border-gray-700 w-[150px] flex-shrink-0">
                <a
                  href={`https://your-jira-instance.com/browse/${upgrade.jira_klic}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-300 hover:underline font-mono text-xs block"
                  style={{ color: '#34d399' }}
                >
                  {upgrade.jira_klic}
                </a>
              </div>
              
              {/* Status */}
              <div className="px-4 py-3 text-sm w-[120px] flex-shrink-0">
                <span 
                  className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: upgrade.stav.toLowerCase() === 'realizováno' ? 'rgba(34, 197, 94, 0.8)' : 
                                   upgrade.stav.toLowerCase() === 'v přípravě' ? 'rgba(234, 179, 8, 0.8)' :
                                   upgrade.stav.toLowerCase() === 'plánováno' ? 'rgba(59, 130, 246, 0.8)' :
                                   upgrade.stav.toLowerCase() === 'pozastaveno' ? 'rgba(239, 68, 68, 0.8)' :
                                   upgrade.stav.toLowerCase() === 'dokončeno' ? 'rgba(249, 115, 22, 0.8)' :
                                   upgrade.stav.toLowerCase() === 'hotovo' ? 'rgba(34, 197, 94, 0.8)' :
                                   upgrade.stav.toLowerCase() === 'provedeno' ? 'rgba(34, 197, 94, 0.8)' :
                                   'rgba(107, 114, 128, 0.8)',
                    color: '#ffffff',
                    border: '1px solid',
                    borderColor: upgrade.stav.toLowerCase() === 'realizováno' ? '#22c55e' : 
                                upgrade.stav.toLowerCase() === 'v přípravě' ? '#eab308' :
                                upgrade.stav.toLowerCase() === 'plánováno' ? '#3b82f6' :
                                upgrade.stav.toLowerCase() === 'pozastaveno' ? '#ef4444' :
                                upgrade.stav.toLowerCase() === 'dokončeno' ? '#f97316' :
                                upgrade.stav.toLowerCase() === 'hotovo' ? '#22c55e' :
                                upgrade.stav.toLowerCase() === 'provedeno' ? '#22c55e' :
                                '#6b7280'
                  }}
                  ref={(el) => {
                    if (el) {
                      // console.log(`=== STYLE CHECK === Computed style for ${upgrade.stav}:`, {
                      //   backgroundColor: window.getComputedStyle(el).backgroundColor,
                      //   color: window.getComputedStyle(el).color,
                      //   borderColor: window.getComputedStyle(el).borderColor
                      // });
                    }
                  }}
                >
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

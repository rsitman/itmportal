import { NextRequest, NextResponse } from 'next/server'
import { Upgrade } from '@/types/upgrade'
import { UpgradeService } from '@/lib/upgrade-service'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    
    // Přidání CORS headers pro lokální vývoj
    const response = await fetch('http://itmsql01:44612/web/upgrades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
      
    if (!response.ok) {
      throw new Error(`Failed to fetch upgrades: ${response.status} ${response.statusText}`)
    }
    
    const upgrades: Upgrade[] = await response.json()
    
    // Seskupení podle projektu
    const groupedUpgrades = UpgradeService.groupUpgradesByProject(upgrades)
    
    // Transformace na pole projektů s jejich upgrady
    const projects = Object.entries(groupedUpgrades).map(([projekt, projectUpgrades]) => ({
      projekt,
      nazev: projectUpgrades[0]?.nazev || `Projekt ${projekt}`,
      upgrades: projectUpgrades.sort((a, b) => 
        new Date(b.datum_od).getTime() - new Date(a.datum_od).getTime()
      )
    }))

    return NextResponse.json({
      success: true,
      data: {
        projects,
        totalUpgrades: upgrades.length,
        totalProjects: projects.length,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Error in upgrades API:', error)
    
    // Specifická hláška pro síťové chyby
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('NetworkError') || 
                          errorMessage.includes('ECONNREFUSED') ||
                          errorMessage.includes('timeout')
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNetworkError ? 'Network error - cannot connect to upgrade server' : 'Failed to fetch upgrades',
        details: errorMessage,
        isNetworkError,
        serverUrl: 'http://itmsql01:44612/web/upgrades'
      },
      { status: 500 }
    )
  }
}

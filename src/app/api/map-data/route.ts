import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

// Helper function to generate logo filename (JavaScript style like in Python scripts)
function sanitizeFilename(companyName: string): string {
  let filename = companyName.toLowerCase()
  // Remove diacritics (basic implementation)
  filename = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Replace non-alphanumeric with underscore
  filename = filename.replace(/[^a-z0-9]/g, '_')
  // Remove multiple underscores
  filename = filename.replace(/_+/g, '_')
  // Remove leading/trailing underscores
  filename = filename.replace(/^_+|_+$/g, '')
  filename += '.png'
  
  return filename
}

// Check if downloaded logo exists in public/logos directory
async function getDownloadedLogoPath(companyName: string): Promise<string | null> {
  try {
    const filename = sanitizeFilename(companyName)
    const logoPath = path.join(process.cwd(), 'public', 'logos', filename)
    
    // Check if file exists
    await fs.access(logoPath)
    return `/logos/${filename}`
  } catch {
    return null
  }
}

interface ProjectData {
  projekt: string
  nazev: string
  jira_klic: string
  nazev_par: string
  gps: string
  logo?: string // Přidáno pro skutečná loga z ERP
}

interface MapCompany {
  id: string
  name: string
  address: string
  city: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
  phone: string
  email: string
  website: string
  employees: number
  foundedYear: number
  industry: string
  description: string
  isProject: boolean
  isDatabase: boolean
  projectId: string
  jiraKey?: string
  customerName: string
  logoBase64?: string
}

// Simple logo generator as base64
function generateLogoBase64(customerName: string): string {
  // Get initials
  const words = customerName.split(' ')
  let initials = ""
  
  for (const word of words.slice(0, 2)) {
    if (word.length > 0) {
      initials += word[0].toUpperCase()
    }
  }
  
  if (initials.length < 2) {
    initials = customerName.slice(0, 2).toUpperCase()
  }
  
  // Generate SVG logo
  const svg = `
    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#3b82f6"/>
      <text x="40" y="40" text-anchor="middle" dominant-baseline="middle" 
            fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function GET() {
  try {
    let projects: ProjectData[] = []
    
    // Načtení projektů přímo z ERP endpointu (stejně jako /api/service-projects)
    try {
      const fetchUrl = 'http://itmsql01:44612/web/projects'
      
      const response = await fetch(fetchUrl)
      
      if (!response.ok) {
        logger.error('Failed to fetch from /web/projects:', response.status)
        throw new Error(`Failed to fetch service projects: ${response.status}`)
      }

      const rawData = await response.json()
      projects = rawData.map((project: any) => ({
        projekt: project.projekt || '',
        nazev: project.nazev || '',
        jira_klic: project.jira_klic || '',
        nazev_par: project.nazev_par || '',
        gps: project.gps || '',
        logo: project.logo || '' // Přidáno pro skutečná loga z ERP
      }))
      
      logger.log(`Načteno ${projects.length} projektů z ERP systému`)
    } catch (fetchError) {
      logger.warn('Nepodařilo se načíst data z /api/service-projects, používám fallback data')
      logger.error('Service projects fetch error:', fetchError)
      
      // Fallback data pro demonstraci
      projects = [
        {
          projekt: '20PRSE0100000003',
          nazev: 'EGE - Servisní podpora IS KARAT',
          jira_klic: 'EGEERP',
          nazev_par: 'EGE, spol. s r.o.',
          gps: '50.0755,14.4378',
          logo: '' // Prázdné - použije se generované logo
        },
        {
          projekt: 'DEMO002', 
          nazev: 'Demo ERP Systém',
          jira_klic: 'DEMO-456',
          nazev_par: 'Demo Průmysl a.s.',
          gps: '49.1951,16.6070',
          logo: '' // Prázdné - použije se generované logo
        },
        {
          projekt: 'DEMO003',
          nazev: 'Demo Mobilní App',
          jira_klic: 'DEMO-789',
          nazev_par: 'Demo Tech CZ',
          gps: '49.8345,18.2880',
          logo: '' // Prázdné - použije se generované logo
        }
      ]
    }

    // Převod projektů na formát pro mapu (asynchronní kvůli kontrole log)
    const companies: MapCompany[] = await Promise.all(projects.map(async (project: ProjectData, index: number) => {
      // Parsování GPS souřadnic
      let latitude = 50.0755 // Default Praha
      let longitude = 14.4378
      
      if (project.gps && project.gps.includes(',')) {
        const [lat, lng] = project.gps.split(',').map(coord => parseFloat(coord.trim()))
        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat
          longitude = lng
        }
      }
      
      // Three-tier logo priority system
      let logoBase64: string
      
      if (project.logo) {
        // Priority 1: ERP logo (base64 from project.logo field)
        logoBase64 = `data:image/png;base64,${project.logo}`
      } else {
        // Priority 2: Check for downloaded logo
        const downloadedLogoPath = await getDownloadedLogoPath(project.nazev_par)
        if (downloadedLogoPath) {
          logoBase64 = downloadedLogoPath
        } else {
          // Priority 3: Generated logo (SVG with initials)
          logoBase64 = generateLogoBase64(project.nazev_par)
        }
      }
      
      return {
        id: project.projekt || `project-${index}`,
        name: project.nazev,
        address: project.nazev_par || 'Neznámá adresa',
        city: project.nazev_par || 'Neznámé město',
        zipCode: '',
        country: 'Česká republika',
        latitude,
        longitude,
        phone: '',
        email: '',
        website: '',
        employees: 1,
        foundedYear: new Date().getFullYear(),
        industry: 'IT',
        description: `Projekt ${project.nazev} pro společnost ${project.nazev_par}`,
        isProject: true,
        isDatabase: false,
        projectId: project.projekt,
        jiraKey: project.jira_klic,
        customerName: project.nazev_par,
        logoBase64
      }
    }))

    // Výpočet metadat
    const countries = [...new Set(companies.map((c: MapCompany) => c.country))]
    const cities = [...new Set(companies.map((c: MapCompany) => c.city))]
    const industries = [...new Set(companies.map((c: MapCompany) => c.industry).filter(Boolean))]
    
    const employeeStats = {
      total: companies.reduce((sum: number, c: MapCompany) => sum + (c.employees || 0), 0),
      average: companies.length > 0 ? companies.reduce((sum: number, c: MapCompany) => sum + (c.employees || 0), 0) / companies.length : 0,
      max: companies.length > 0 ? Math.max(...companies.map((c: MapCompany) => c.employees || 0)) : 0,
      min: companies.length > 0 ? Math.min(...companies.map((c: MapCompany) => c.employees || 0)) : 0
    }
    
    const projectCount = companies.filter((c: MapCompany) => c.isProject).length
    const databaseCount = companies.filter((c: MapCompany) => c.isDatabase).length
    
    const mapData = {
      companies,
      metadata: {
        totalCompanies: companies.length,
        countries,
        cities,
        industries,
        employeeStats,
        projectCount,
        databaseCount
      }
    }
    
    logger.log(`Vracím ${companies.length} projektů pro mapu`)
    return NextResponse.json(mapData)
  } catch (error) {
    logger.error('Error fetching map data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch map data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

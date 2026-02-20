import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Mock data for companies with coordinates
const mockCompanies = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    address: 'Hlavní 123',
    city: 'Praha',
    zipCode: '11000',
    country: 'Česká republika',
    latitude: 50.0755,
    longitude: 14.4378,
    phone: '+420 123 456 789',
    email: 'info@techcorp.cz',
    website: 'https://techcorp.cz',
    employees: 150,
    foundedYear: 2010,
    industry: 'Technologie',
    description: 'Vývoj softwarových řešení pro firmy'
  },
  {
    id: '2',
    name: 'Manufacturing Plus',
    address: 'Průmyslová 456',
    city: 'Brno',
    zipCode: '62800',
    country: 'Česká republika',
    latitude: 49.1951,
    longitude: 16.6070,
    phone: '+420 234 567 890',
    email: 'kontakt@manufacturing.cz',
    website: 'https://manufacturing.cz',
    employees: 75,
    foundedYear: 2005,
    industry: 'Výroba',
    description: 'Výroba průmyslových strojů'
  },
  {
    id: '3',
    name: 'ServicePro',
    address: 'Servisní 789',
    city: 'Ostrava',
    zipCode: '70200',
    country: 'Česká republika',
    latitude: 49.8395,
    longitude: 18.2925,
    phone: '+420 345 678 901',
    email: 'info@servicepro.cz',
    website: 'https://servicepro.cz',
    employees: 45,
    foundedYear: 2015,
    industry: 'Služby',
    description: 'Profesionální služby pro firmy'
  },
  {
    id: '4',
    name: 'RetailMax',
    address: 'Nákupní 321',
    city: 'Plzeň',
    zipCode: '30100',
    country: 'Česká republika',
    latitude: 49.7474,
    longitude: 13.3736,
    phone: '+420 456 789 012',
    email: 'obchod@retailmax.cz',
    website: 'https://retailmax.cz',
    employees: 200,
    foundedYear: 2008,
    industry: 'Maloobchod',
    description: 'Maloobchodní síť prodejen'
  },
  {
    id: '5',
    name: 'DataTech International',
    address: 'Digital Park 1',
    city: 'Bratislava',
    zipCode: '82105',
    country: 'Slovensko',
    latitude: 48.1486,
    longitude: 17.1077,
    phone: '+421 123 456 789',
    email: 'info@datatech.sk',
    website: 'https://datatech.sk',
    employees: 120,
    foundedYear: 2012,
    industry: 'Technologie',
    description: 'Datové analytické řešení'
  },
  {
    id: '6',
    name: 'Logistics Central',
    address: 'Dopravní 555',
    city: 'Budapest',
    zipCode: '1111',
    country: 'Maďarsko',
    latitude: 47.4979,
    longitude: 19.0402,
    phone: '+36 123 456 789',
    email: 'info@logistics.hu',
    website: 'https://logistics.hu',
    employees: 85,
    foundedYear: 2018,
    industry: 'Logistika',
    description: 'Mezinárodní logistické služby'
  }
]

async function getServiceProjects(): Promise<any[]> {
  try {
    const fetchUrl = 'http://itmsql01:44612/web/projects'
    const response = await fetch(fetchUrl)
    
    if (!response.ok) {
      logger.error('Failed to fetch service projects for map:', response.status)
      return []
    }
    
    const projects = await response.json()
    logger.log(`✅ ${projects.length} service projects from KARAT`)
    return projects
  } catch (error) {
    logger.error('Error fetching service projects for map:', error)
    return []
  }
}

// Function to parse GPS coordinates from string
function parseGPS(gpsString: string): { latitude: number; longitude: number } | null {
  if (!gpsString) return null
  
  // Expected format: "50.0755,14.4378" or "50.0755,14.4378"
  const coords = gpsString.split(',').map(coord => coord.trim())
  
  if (coords.length !== 2) return null
  
  const lat = parseFloat(coords[0])
  const lng = parseFloat(coords[1])
  
  if (isNaN(lat) || isNaN(lng)) return null
  
  return { latitude: lat, longitude: lng }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const industry = searchParams.get('industry')
    const search = searchParams.get('search')

    // Get service projects with GPS coordinates
    const serviceProjects = await getServiceProjects()
    
    // Convert service projects to company format
    const projectCompanies = serviceProjects
      .filter(project => project.gps) // Only include projects with GPS data
      .map(project => {
        const coords = parseGPS(project.gps)
        if (!coords) return null
        
        // Return only one company per project (not multiple databases)
        return {
          id: `project-${project.projekt}`,
          name: project.nazev,
          address: project.nazev_par || '',
          city: 'Neznámé',
          zipCode: '',
          country: 'Česká republika',
          latitude: coords.latitude,
          longitude: coords.longitude,
          phone: '',
          email: '',
          website: '',
          employees: 0,
          foundedYear: new Date().getFullYear(),
          industry: 'KARAT Projekt',
          description: `KARAT projekt: ${project.nazev}`,
          isProject: true, // Flag to distinguish from regular companies
          projectId: project.projekt,
          jiraKey: project.jira_klic,
          customerName: project.nazev_par // Název zákazníka/firmy
        }
      })
      .filter(Boolean) // Remove null entries

    // Combine mock companies with project companies
    const allCompanies = [...mockCompanies, ...projectCompanies]

    let filteredCompanies = allCompanies

    // Apply filters
    if (country && country !== 'all') {
      filteredCompanies = filteredCompanies.filter(company => 
        company && company.country.toLowerCase().includes(country.toLowerCase())
      )
    }

    if (industry && industry !== 'all') {
      filteredCompanies = filteredCompanies.filter(company => 
        company && company.industry?.toLowerCase().includes(industry.toLowerCase())
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCompanies = filteredCompanies.filter(company =>
        company && (
          company.name.toLowerCase().includes(searchLower) ||
          company.address.toLowerCase().includes(searchLower) ||
          company.city.toLowerCase().includes(searchLower) ||
          company.description?.toLowerCase().includes(searchLower)
        )
      )
    }

    // Calculate metadata
    const countries = [...new Set(allCompanies.filter((c): c is NonNullable<typeof c> => c != null).map(c => c.country).filter(Boolean))]
    const cities = [...new Set(allCompanies.filter((c): c is NonNullable<typeof c> => c != null).map(c => c.city).filter(Boolean))]
    const industries = [...new Set(allCompanies.filter((c): c is NonNullable<typeof c> => c != null).map(c => c.industry).filter(Boolean))]
    
    const employeeCounts = allCompanies.filter((c): c is NonNullable<typeof c> => c != null).map(c => c.employees || 0)
    const employeeStats = {
      total: employeeCounts.reduce((sum, count) => sum + count, 0),
      average: employeeCounts.reduce((sum, count) => sum + count, 0) / employeeCounts.length,
      max: Math.max(...employeeCounts),
      min: Math.min(...employeeCounts)
    }

    const response = {
      companies: filteredCompanies,
      metadata: {
        totalCompanies: allCompanies.length,
        countries,
        cities,
        industries,
        employeeStats,
        projectCount: projectCompanies.length // Add project count
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Error fetching company map data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

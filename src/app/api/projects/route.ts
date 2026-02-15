import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { KaratProject } from '@/lib/karat'
import { logger } from '@/lib/logger'

async function getKaratProjects(): Promise<KaratProject[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/karat/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch KARAT projects: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    logger.error('Error fetching KARAT projects:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch projects from KARAT system
    const karatProjects = await getKaratProjects()
    
    // Transform KARAT projects to Project Management System format
    const projects = karatProjects.map((project: KaratProject) => ({
      id: `${project.companyId}-${project.projectId}`, // Composite ID
      projectId: project.projectId,
      projectName: project.projectName,
      companyId: project.companyId,
      companyName: project.companyName,
      
      // Project metadata - defaults for KARAT data
      status: 'ACTIVE' as const, // KARAT projects are assumed active
      priority: 'MEDIUM' as const, // Default priority
      startDate: new Date('2024-01-01'), // Default start date
      endDate: null, // No end date for active projects
      
      // Technical details from KARAT
      version: project.version,
      country: project.country,
      accountManager: project.accountManager,
      jiraKey: project.jiraKey,
      
      // Patch management from KARAT
      hasPayrollModule: project.hasPayrollModule,
      hasServicePatch: project.hasServicePatch,
      hasNewPatch: project.hasNewPatch,
      hasNewLegalPatch: project.hasNewLegalPatch,
      lastInstalledPatchDate: project.lastInstalledPatchDate,
      nextPlannedPatchDate: project.nextPlannedPatchDate,
      
      // System timestamps
      createdAt: new Date('2024-01-01'), // Default creation date
      updatedAt: new Date(), // Current update time
      lastSyncAt: new Date() // When this data was synced from KARAT
    }))

    return NextResponse.json(projects)
    
  } catch (error) {
    logger.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // TODO: Implement project creation
    // For now, return not implemented
    return NextResponse.json(
      { error: 'Project creation not yet implemented' },
      { status: 501 }
    )
    
  } catch (error) {
    logger.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

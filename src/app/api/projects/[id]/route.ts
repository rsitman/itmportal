import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { KaratProject } from '@/lib/karat'
import { ProjectPerson } from '@/types/project'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const projectCode = resolvedParams.id

    // Original project detail logic only
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
    const karatProjects = data
    const karatProject = karatProjects.find((project: any) => project.companyId === projectCode)
    
    if (!karatProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Transform KARAT project to Project Management System format
    const project = {
      id: projectCode,
      projectId: karatProject?.projectId || '',
      projectName: karatProject?.projectName || '',
      companyId: karatProject?.companyId || projectCode,
      companyName: karatProject?.companyName || '',
      
      // Project metadata - defaults for KARAT data
      status: 'ACTIVE' as const,
      priority: 'MEDIUM' as const,
      startDate: new Date('2024-01-01'),
      endDate: null,
      
      // Technical details from KARAT
      version: karatProject?.version || '',
      country: karatProject?.country || '',
      accountManager: karatProject?.accountManager || '',
      jiraKey: karatProject?.jiraKey || '',
      
      // Patch management from KARAT
      hasPayrollModule: karatProject?.hasPayrollModule || false,
      hasServicePatch: karatProject?.hasServicePatch || false,
      hasNewPatch: karatProject?.hasNewPatch || false,
      hasNewLegalPatch: karatProject?.hasNewLegalPatch || false,
      lastInstalledPatchDate: karatProject?.lastInstalledPatchDate || null,
      nextPlannedPatchDate: karatProject?.nextPlannedPatchDate || null,
      
      // System timestamps
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      lastSyncAt: new Date()
    }

    return NextResponse.json(project)

  } catch (error) {
    logger.error('Error in project API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const companyId = resolvedParams.id
    const body = await request.json()
    
    // TODO: Implement project update
    return NextResponse.json(
      { error: 'Project update not yet implemented' },
      { status: 501 }
    )
    
  } catch (error) {
    logger.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const companyId = resolvedParams.id
    
    // TODO: Implement project deletion
    return NextResponse.json(
      { error: 'Project deletion not yet implemented' },
      { status: 501 }
    )
    
  } catch (error) {
    logger.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}

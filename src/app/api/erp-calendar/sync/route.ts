import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ErpCalendarService } from '@/lib/erp-calendar'
import { hasPermission, Permission, Role } from '@/lib/permissions'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to sync ERP events
    if (!hasPermission(user.role as Role, Permission.CALENDAR_ERP_SYNC)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Perform synchronization
    const result = await ErpCalendarService.syncErpEvents()

    // Log the sync operation
    logger.log(`ERP Sync performed by ${user.email} (${user.role}):`, result)

    return NextResponse.json({
      success: true,
      message: 'ERP synchronization completed',
      result
    })

  } catch (error) {
    logger.error('Error during ERP synchronization:', error)
    return NextResponse.json(
      { 
        error: 'Synchronization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, Permission, Role } from '@/lib/permissions'
import { ErpCalendarService } from '@/lib/erp-calendar'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Get the user from database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Create user if doesn't exist (for Azure AD users)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Azure AD User',
          role: 'USER',
          authProvider: 'AZURE_AD',
          isActive: true
        }
      })
      logger.log('Created new user for Azure AD:', session.user.email)
    }

    // Build date filter
    let dateFilter: any = {}
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0) // Last day of month
      
      dateFilter = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get user's local events
    const localEvents = await prisma.event.findMany({
      where: {
        ownerId: user.id,
        ...(Object.keys(dateFilter).length > 0 && {
          startDate: dateFilter
        })
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    logger.log('API: Found local events:', localEvents.length)

    // Get all ERP events (online - not from database)
    let erpEvents: any[] = []
    try {
      logger.log('API: Starting ERP events fetch')
      const erpRawEvents = await ErpCalendarService.fetchErpEvents()
      erpEvents = erpRawEvents.map(event => ErpCalendarService.convertToDbEvent(event))
      logger.log('API: Successfully fetched and converted ERP events:', erpEvents.length)
    } catch (error) {
      // Check if this is expected 404 error (ERP calendar not implemented)
      if (error instanceof Error && error.message.includes('404')) {
        logger.log('API: ERP calendar endpoint not available - continuing without ERP events')
      } else {
        logger.error('API: Failed to fetch ERP events:', error)
      }
      // Continue without ERP events if fetch fails
      // Don't add to errors array, just log and continue
    }

    // Combine and return all events
    const allEvents = [...localEvents, ...erpEvents]

    // Transform database events to match Event interface
    const transformedEvents = allEvents.map((event: any) => ({
      ...event,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      // Remove the original fields to avoid confusion
      startDate: undefined,
      endDate: undefined,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    logger.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, type, allDay, outlookId } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the user from database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Create user if doesn't exist (for Azure AD users)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Azure AD User',
          role: 'USER',
          authProvider: 'AZURE_AD',
          isActive: true
        }
      })
      logger.log('Created new user for Azure AD:', session.user.email)
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        allDay: allDay || false,
        outlookId: outlookId || null,
        ownerId: user.id
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    logger.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

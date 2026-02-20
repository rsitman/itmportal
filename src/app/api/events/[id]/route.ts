import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, Permission, Role } from '@/lib/permissions'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const { title, description, startDate, endDate, type, allDay, outlookId } = body

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if event exists
    const existingEvent = await (prisma.event as any).findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check permissions for updating
    if (existingEvent.isErpEvent) {
      // ERP events require special permissions
      if (!hasPermission(user.role as Role, Permission.CALENDAR_ERP_EDIT)) {
        return NextResponse.json({ error: 'Insufficient permissions to edit ERP events' }, { status: 403 })
      }
    } else {
      // Local events - check ownership
      if (existingEvent.ownerId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Update event
    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(type && { type }),
      ...(allDay !== undefined && { allDay }),
      ...(outlookId !== undefined && { outlookId }),
      updatedAt: new Date()
    }

    const event = await prisma.event.update({
      where: { id: resolvedParams.id },
      data: updateData
    })

    return NextResponse.json(event)
  } catch (error) {
    logger.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    // Get the user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if event exists
    const existingEvent = await (prisma.event as any).findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check permissions for deleting
    if (existingEvent.isErpEvent) {
      // ERP events require special permissions
      if (!hasPermission(user.role as Role, Permission.CALENDAR_ERP_DELETE)) {
        return NextResponse.json({ error: 'Insufficient permissions to delete ERP events' }, { status: 403 })
      }
    } else {
      // Local events - check ownership
      if (existingEvent.ownerId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Delete event
    await prisma.event.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    logger.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user from database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete all events with outlookId (all Outlook events)
    const deleteResult = await prisma.event.deleteMany({
      where: {
        outlookId: {
          not: null
        }
      }
    })

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count
    })

  } catch (error) {
    logger.error('Error deleting Outlook events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ErpCalendarService } from '@/lib/erp-calendar'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ERP events from database (shared for all users)
    const erpEvents = await ErpCalendarService.getErpEvents()

    return NextResponse.json(erpEvents)

  } catch (error) {
    logger.error('Error fetching ERP events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'

// GET /api/hwsw/software - Get software licenses from ERP
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/sw-licenses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      logger.error('ERP software licenses error:', response.status, response.statusText)
      // Fallback to empty data if ERP is unavailable
      return NextResponse.json({ software: [], total: 0 })
    }

    const data = await response.json()
    logger.log(`✅ ${data.length || 0} software licenses from ERP`)
    
    return NextResponse.json({
      software: data || [],
      total: data?.length || 0
    })

  } catch (error) {
    logger.error('Error fetching software licenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/software - Add/update software license
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/sw-licenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      logger.error('ERP software license save error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to save software license' }, { status: 500 })
    }

    const data = await response.json()
    logger.log(`✅ Software license saved: ${data.id || 'unknown'}`)
    
    return NextResponse.json(data, { status: 201 })
    
  } catch (error) {
    logger.error('Error saving software license:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

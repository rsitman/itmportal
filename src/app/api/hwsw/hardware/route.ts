import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'

// GET /api/hwsw/hardware - Get hardware assets from ERP
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/hw-assets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      logger.error('ERP hardware assets error:', response.status, response.statusText)
      // Fallback to empty data if ERP is unavailable
      return NextResponse.json({ hardware: [], total: 0 })
    }

    const data = await response.json()
    logger.log(`✅ ${data.length || 0} hardware assets from ERP`)
    
    return NextResponse.json({
      hardware: data || [],
      total: data?.length || 0
    })

  } catch (error) {
    logger.error('Error fetching hardware assets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/hardware - Add/update hardware asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/hw-assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      logger.error('ERP hardware asset save error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to save hardware asset' }, { status: 500 })
    }

    const data = await response.json()
    logger.log(`✅ Hardware asset saved: ${data.id || 'unknown'}`)
    
    return NextResponse.json(data, { status: 201 })
    
  } catch (error) {
    logger.error('Error saving hardware asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

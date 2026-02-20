import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'

// GET /api/hwsw/network - Get network configuration from ERP
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/network-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      logger.error('ERP network configuration error:', response.status, response.statusText)
      // Fallback to empty data if ERP is unavailable
      return NextResponse.json({ network: { devices: [], servers: [], connections: [] } })
    }

    const data = await response.json()
    const deviceCount = data?.devices?.length || 0
    const serverCount = data?.servers?.length || 0
    logger.log(`✅ ${deviceCount} network devices, ${serverCount} servers from ERP`)
    
    return NextResponse.json({
      network: data || { devices: [], servers: [], connections: [] }
    })

  } catch (error) {
    logger.error('Error fetching network configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/network - Update network configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Real ERP endpoint integration
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    const response = await fetch(`${erpUrl}/web/network-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      logger.error('ERP network configuration save error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to save network configuration' }, { status: 500 })
    }

    const data = await response.json()
    logger.log(`✅ Network configuration saved: ${data.id || 'unknown'}`)
    
    return NextResponse.json(data, { status: 201 })
    
  } catch (error) {
    logger.error('Error updating network configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

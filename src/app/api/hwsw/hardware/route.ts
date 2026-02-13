import { NextRequest, NextResponse } from 'next/server'

// GET /api/hwsw/hardware - Get hardware assets from ERP
// TODO: Až bude ERP endpoint dostupný, připojit na http://itmsql01:44612/web/hw-assets
export async function GET(request: NextRequest) {
  try {
    // Mock data - ERP endpoint zatím neexistuje
    return NextResponse.json({
      hardware: [
        {
          id: 'HW001',
          name: 'Dell OptiPlex 7090',
          type: 'PC',
          manufacturer: 'Dell',
          model: 'OptiPlex 7090',
          serialNumber: 'DL-OP7090-001',
          purchaseDate: '2023-01-15',
          warrantyExpiry: '2026-01-15',
          location: 'Kancelář - přízemí',
          assignedTo: 'Jan Novák',
          status: 'active',
          ipAddress: '192.168.1.101',
          macAddress: '00:1A:2B:3C:4D:5E',
          osVersion: 'Windows 11 Pro',
          specifications: {
            cpu: 'Intel Core i7-12700',
            ram: '32GB DDR4',
            disk: '512GB NVMe SSD',
            graphics: 'Intel UHD Graphics 770'
          },
          projectId: 'PROJ001',
          projectName: 'Firemní portál',
          notes: 'Hlavní pracovní stanice'
        }
      ],
      total: 1
    })
  } catch (error) {
    console.error('Error fetching hardware assets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/hardware - Add/update hardware asset
// TODO: Až bude ERP endpoint dostupný, připojit na POST http://itmsql01:44612/web/hw-assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Mock response - ERP endpoint zatím neexistuje
    return NextResponse.json({ ...body, id: `HW${Date.now()}` }, { status: 201 })
  } catch (error) {
    console.error('Error saving hardware asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

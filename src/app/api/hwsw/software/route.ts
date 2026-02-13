import { NextRequest, NextResponse } from 'next/server'

// GET /api/hwsw/software - Get software licenses from ERP
// TODO: Až bude ERP endpoint dostupný, připojit na http://itmsql01:44612/web/sw-licenses
export async function GET(request: NextRequest) {
  try {
    // Mock data - ERP endpoint zatím neexistuje
    return NextResponse.json({
      software: [
        {
          id: 'SW001',
          name: 'Microsoft Office 365',
          version: '2024',
          vendor: 'Microsoft',
          licenseKey: 'XXXX-XXXX-XXXX-XXXX',
          licenseExpiry: '2025-12-31',
          installationDate: '2023-06-01',
          category: 'Office Software',
          type: 'subscription',
          seats: 50,
          usedSeats: 35,
          status: 'active',
          installedOn: ['HW001', 'HW002', 'HW003'],
          projectId: 'PROJ001',
          projectName: 'Firemní portál',
          notes: 'Firemní licence pro všechny zaměstnance'
        },
        {
          id: 'SW002',
          name: 'KARAT ERP',
          version: '3.2.1',
          vendor: 'KARAT Software',
          licenseKey: 'KARAT-2024-PROD',
          licenseExpiry: '2026-06-30',
          installationDate: '2023-02-15',
          category: 'ERP System',
          type: 'perpetual',
          status: 'active',
          installedOn: ['SRV001'],
          projectId: 'PROJ001',
          projectName: 'Firemní portál',
          notes: 'Hlavní ERP systém společnosti'
        }
      ],
      total: 2
    })
  } catch (error) {
    console.error('Error fetching software licenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/software - Add/update software license
// TODO: Až bude ERP endpoint dostupný, připojit na POST http://itmsql01:44612/web/sw-licenses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Mock response - ERP endpoint zatím neexistuje
    return NextResponse.json({ ...body, id: `SW${Date.now()}` }, { status: 201 })
  } catch (error) {
    console.error('Error saving software license:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

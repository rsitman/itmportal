import { NextRequest, NextResponse } from 'next/server'

// GET /api/hwsw/network - Get network configuration from ERP
// TODO: Až bude ERP endpoint dostupný, připojit na http://itmsql01:44612/web/network-config
export async function GET(request: NextRequest) {
  try {
    // Mock data - ERP endpoint zatím neexistuje
    return NextResponse.json({
      network: {
        devices: [
          {
            id: 'NET001',
            name: 'Core Switch 01',
            type: 'switch',
            manufacturer: 'Cisco',
            model: 'Catalyst 2960-X',
            ipAddress: '192.168.1.1',
            subnet: '255.255.255.0',
            vlan: '1',
            ports: 48,
            status: 'active',
            location: 'Serverovna',
            configuration: {
              dns: ['192.168.1.10', '8.8.8.8'],
              gateway: '192.168.1.1',
              dhcp: {
                enabled: true,
                range: '192.168.1.100-192.168.1.200'
              }
            },
            projectId: 'PROJ001',
            projectName: 'Firemní portál'
          }
        ],
        servers: [
          {
            id: 'SRV001',
            name: 'AD Server',
            type: 'domain_controller',
            ipAddress: '192.168.1.10',
            role: 'Primary DC',
            status: 'active',
            services: ['Active Directory', 'DNS', 'DHCP'],
            configuration: {
              domain: 'firma.local',
              forest: 'firma.local',
              sites: ['Default-First-Site-Name']
            },
            projectId: 'PROJ001',
            projectName: 'Firemní portál'
          }
        ],
        connections: [
          {
            id: 'CONN001',
            source: 'NET001',
            target: 'SRV001',
            type: 'ethernet',
            port: 1,
            speed: '1Gbps',
            status: 'active'
          }
        ]
      }
    })
  } catch (error) {
    console.error('Error fetching network configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/hwsw/network - Update network configuration
// TODO: Až bude ERP endpoint dostupný, připojit na POST http://itmsql01:44612/web/network-config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Mock response - ERP endpoint zatím neexistuje
    return NextResponse.json({ ...body, id: `NET${Date.now()}` }, { status: 201 })
  } catch (error) {
    console.error('Error updating network configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

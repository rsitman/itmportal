import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HwswConfig } from '@/types/hwsw-config'
import { logger } from '@/lib/logger'

const MOCK_HWSW_CONFIG: HwswConfig = {
  fw_pristupy: [
    { ip_adresa: '212.20.99.136', id_firmy: '', popis: '' },
    { ip_adresa: '80.94.53.206', id_firmy: '', popis: 'STEP' },
    { ip_adresa: '90.182.118.34', id_firmy: '', popis: 'KSW' },
  ],
  dom_users: [
    {
      login: 'signum\\itman.augustin',
      domena: 'signum',
      username: 'itman.augustin',
      heslo: '****',
      poznamka: '',
    },
    {
      login: 'signum\\itman.chodil',
      domena: 'signum',
      username: 'itman.chodil',
      heslo: '****',
      poznamka: '',
    },
    {
      login: 'signum\\karatsvc',
      domena: 'signum',
      username: 'karatsvc',
      heslo: '****',
      poznamka: 'Servis SIGNUM a NFS',
    },
  ],
  set_send_mail: [
    {
      id_firmy: 'SIGNUM',
      ip_adresa: '192.168.198.203',
      port: 25,
      login: 'karat@signumcz.com',
      heslo: '****',
      poznamka: 'Platí i pro NFS',
    },
    {
      id_firmy: 'ELEKTROVOD_SK',
      ip_adresa: '10.10.10.40',
      port: 25,
      login: 'karat@elv-slovakia.sk',
      heslo: '****',
      poznamka: '',
    },
  ],
  ext_sluzby: [
    {
      nazev: 'AiDOCU',
      popis: 'Vytěžování dokumentů',
      poznamka:
        'URL\nostrá - https://aidocu-isk-api.amitia-ai.com/api/v1\ntestovací - https://aidocu-isk-api-test.amitia-ai.com/api/v1',
    },
    {
      nazev: 'DigReader',
      popis: 'Vyčítání vyrženého čísla',
      poznamka: 'URL - http://dig-reader-api.amitia-ai.com',
    },
    {
      nazev: 'PLAiN',
      popis: 'Plánování',
      poznamka:
        'URL\nostrá - https://plain-api.amitia-ai.com/api/v1\ntestovací - https://plain-api-test.amitia-ai.com/api/v1',
    },
  ],
  servery: [
    {
      server_id: 1,
      id_firmy: '',
      server_typ: 'SQL server',
      nazev: 'tereza.silroc.lan',
      popis: 'DB server SILROC',
      ip_adresa: '192.168.1.207',
      maska: '255.255.255.0',
      brana: '192.168.1.201',
      dns: '192.168.1.204',
      os_app: 'Windows Server 2016 Standard',
      os_lic: '',
      poznamka: '',
      sluzby: [
        {
          poradi: 1,
          kod: 'SQL_SERVER',
          typ: 'SQL server',
          nazev: 'SQL server',
          popis: '',
          poznamka:
            'V rámci instalace serveru 2019 byl instalován CU25, což je poslední CU ke dni instalace.',
          verze: 'Microsoft SQL Server 2019 (RTM-CU32-GDR)',
          typ_uctu: 'Lokální účet',
          login: 'NT Service\\MSSQL$KARAT',
          heslo: '***',
          sql_instance: 'karat',
        },
      ],
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projekt = searchParams.get('projekt')

    if (!projekt) {
      return NextResponse.json({ error: 'projekt parameter is required' }, { status: 400 })
    }

    // Use request origin so internal fetch always hits same app (no NEXTAUTH_URL dependency)
    let baseUrl: string
    try {
      baseUrl = new URL(request.url).origin
    } catch {
      baseUrl = process.env.NODE_ENV === 'production'
        ? (process.env.NEXTAUTH_URL || 'http://localhost:3000')
        : 'http://localhost:3000'
    }
    const proxyUrl = `${baseUrl}/api/erp-proxy/projects/${encodeURIComponent(projekt)}/itconf`
    logger.log(`Fetching HWSW config from: ${proxyUrl}`)

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const bodyPreview = await response.text().then((t) => t.slice(0, 200)).catch(() => '')
      logger.error(`ERP proxy error: ${response.status} ${response.statusText}`, bodyPreview ? ` body: ${bodyPreview}` : '')
      
      // Použij mock pouze při skutečném HTTP 500 z ERP/proxy
      if (response.status === 500) {
        logger.log(`Proxy returned 500, returning mock data for project ${projekt}`)
        return NextResponse.json(MOCK_HWSW_CONFIG)
      }

      // Pro ostatní HTTP kódy vrať reálnou chybu dál
      return NextResponse.json(
        { error: `Failed to fetch configuration from ERP API: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Validate and transform data if needed
    const hwswConfig: HwswConfig = {
      fw_pristupy: data.fw_pristupy || [],
      dom_users: data.dom_users || [],
      set_send_mail: data.set_send_mail || [],
      ext_sluzby: data.ext_sluzby || [],
      servery: data.servery || []
    }

    logger.log(`HWSW config for ${projekt}: ${hwswConfig.servery.length} servers, ${hwswConfig.dom_users.length} users`)

    return NextResponse.json(hwswConfig)

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error in HWSW config API:', err.message, err.stack)
    // Při technické chybě (timeout, DNS, atd.) vrať standardní 500 bez mocku
    return NextResponse.json(
      { error: 'Internal server error while fetching HWSW configuration' },
      { status: 500 }
    )
  }
}

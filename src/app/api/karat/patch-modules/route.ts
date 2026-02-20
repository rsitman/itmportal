import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PatchModule } from '@/types/project'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Získání parametrů z URL
    const { searchParams } = new URL(request.url)
    const projekt = searchParams.get('projekt')
    const id_firmy = searchParams.get('firma')
    
    if (!projekt || !id_firmy) {
      return NextResponse.json({ error: 'Missing required parameters: projekt and firma are required' }, { status: 400 })
    }
    
    // Volání na reálný IS KARAT endpoint
    const fetchUrl = `http://itmsql01:44612/web/patchovani/${projekt}/firma/${id_firmy}/moduly`
    
    logger.log(`Fetching patch modules for project: ${projekt}, company: ${id_firmy}`)
    
    const response = await fetch(fetchUrl)
    
    if (!response.ok) {
      logger.error(`Failed to fetch patch modules: ${response.status}`)
      return NextResponse.json({ error: 'KARAT unavailable' }, { status: 500 })
    }

    const rawData = await response.json()
    logger.log(`✅ ${rawData.length} patch modules from KARAT`)
    
    // Transformace dat na správnou strukturu
    const patchModules: PatchModule[] = rawData.map((module: any) => ({
      id_modulu: module.id_modulu || '',
      nazev: module.nazev || '',
      verze: module.verze || '',
      posl_patch_40: module.posl_patch_40 || '000',
      posl_patch_36: module.posl_patch_36 || '000',
      max_patch_40: module.max_patch_40 || '000',
      max_patch_36: module.max_patch_36 || '000',
      stat: module.stat || ''
    }))
    
    return NextResponse.json(patchModules)

  } catch (error) {
    logger.error('KARAT patch modules error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

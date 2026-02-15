import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mapKaratProjects } from '@/lib/karat'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fetchUrl = 'http://itmsql01:44612/web/patchovani_data'
    const response = await fetch(fetchUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'KARAT unavailable' }, { status: 500 })
    }

    const rawData = await response.json()  // ✅ JSON!
    logger.log('Raw data from /web/patchovani_data:', rawData)
    const projects = mapKaratProjects(rawData)
    logger.log('Mapped karat projects:', projects)
    
    logger.log(`✅ ${projects.length} KARAT projects ready`)
    return NextResponse.json(projects)

  } catch (error) {
    logger.error('KARAT error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

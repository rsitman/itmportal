import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Contact } from '@/types/contact'
import { logger } from '@/lib/logger'

const ERP_BASE = process.env.ERP_API_URL || 'http://itmsql01:44612'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = `${ERP_BASE}/web/contacts`
    logger.log(`Fetching contacts from ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      logger.error('ERP contacts error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `ERP error: ${response.status}`, contacts: [] as Contact[] },
        { status: response.status }
      )
    }

    const data = await response.json()
    const contacts: Contact[] = Array.isArray(data) ? data : []
    logger.log('Contacts received:', contacts.length)

    return NextResponse.json(contacts)
  } catch (error) {
    logger.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

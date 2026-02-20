import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAccessToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const accessToken = getAccessToken(session)
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Get date range from query params
    const startDateTime = searchParams.get('startDateTime') || new Date().toISOString()
    const endDateTime = searchParams.get('endDateTime') || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    // Získání více událostí (až 999) - pro kompletní synchronizaci
    const eventsUrl = `https://graph.microsoft.com/v1.0/me/events?$select=id,subject,bodyPreview,start,end,location,isAllDay&$orderby=start/dateTime desc&startDateTime=${startDateTime}&endDateTime=${endDateTime}&$top=999`
    
    const graphResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text()
      return NextResponse.json(
        { error: 'Failed to fetch more Outlook events', details: errorText },
        { status: graphResponse.status }
      )
    }

    const data = await graphResponse.json()

    // Return events array
    return NextResponse.json(data.value || data)

  } catch (error) {
    logger.error('🔍 DEBUG: Error in more events API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

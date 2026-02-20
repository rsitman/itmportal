import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Get Microsoft Graph access token from session
function getAccessToken(session: any): string | null {
  // Pro Azure AD uživatele by měl být access token v session
  if (session?.accessToken) {
    return session.accessToken as string
  }
  
  // Pro lokální uživatele můžeme zkusit získat token přes refresh token
  // nebo vyžadovat explicitní přihlášení přes Azure AD
  return null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const accessToken = getAccessToken(session)
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token available. Please sign in with Azure AD for calendar integration.' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Get date range from query params
    const startDateTime = searchParams.get('startDateTime') || new Date().toISOString()
    const endDateTime = searchParams.get('endDateTime') || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    // Získání událostí z aktuálního roku (nejnovější první, 50 událostí - rychlá synchronizace)
    const eventsUrl = `https://graph.microsoft.com/v1.0/me/events?$select=id,subject,bodyPreview,start,end,location,isAllDay&$orderby=start/dateTime desc&startDateTime=${startDateTime}&endDateTime=${endDateTime}&$top=50`
    
    const graphResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text()
      return NextResponse.json(
        { error: 'Failed to fetch Outlook events', details: errorText },
        { status: graphResponse.status }
      )
    }

    const data = await graphResponse.json()

    // Return events array
    return NextResponse.json(data.value || data)

  } catch (error) {
    logger.error('Error fetching Outlook calendar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const accessToken = getAccessToken(session)
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token available. Please sign in with Azure AD for calendar integration.' 
      }, { status: 401 })
    }

    const eventData = await request.json()

    // Create event in Microsoft Graph API
    const graphResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: eventData.title,
          body: {
            contentType: 'HTML',
            content: eventData.description || ''
          },
          start: {
            dateTime: eventData.startDate,
            timeZone: 'Central European Standard Time'
          },
          end: {
            dateTime: eventData.endDate,
            timeZone: 'Central European Standard Time'
          },
          location: {
            displayName: eventData.location || ''
          },
          isAllDay: eventData.allDay || false
        })
      }
    )

    if (!graphResponse.ok) {
      const errorData = await graphResponse.text()
      logger.error('Graph API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create event in Microsoft Graph' },
        { status: graphResponse.status }
      )
    }

    const newEvent = await graphResponse.json()
    return NextResponse.json(newEvent)
  } catch (error) {
    logger.error('Error creating Outlook event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

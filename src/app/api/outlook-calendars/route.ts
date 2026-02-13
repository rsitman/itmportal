import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get Microsoft Graph access token from session
function getAccessToken(session: any): string | null {
  
  if (session?.accessToken) {
    return session.accessToken as string
  }
  
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
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    // Získání všech kalendářů
    const calendarsUrl = 'https://graph.microsoft.com/v1.0/me/calendars'
    
    const calendarsResponse = await fetch(calendarsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!calendarsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: calendarsResponse.status })
    }

    const calendarsData = await calendarsResponse.json()

    return NextResponse.json(calendarsData)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

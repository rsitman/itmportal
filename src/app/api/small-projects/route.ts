import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { logger } from '@/lib/logger'
import { authOptions } from '@/lib/auth'
import { getKaratFetchErrorResponseBody, mapSmallProjects } from '@/lib/small-projects-mapper'

function getKaratBaseUrl() {
  return (process.env.KARAT_API_URL || 'http://itmsql01:44612/web').replace(/\/$/, '')
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken
    const fetchUrl = `${getKaratBaseUrl()}/small_projects`
    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Server',
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    logger.log('Fetching small projects from:', fetchUrl)

    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers,
    })

    if (!response.ok) {
      logger.error('Failed to fetch from /web/small_projects:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch small projects' },
        { status: response.status }
      )
    }

    const rawData = await response.json()
    const projects = mapSmallProjects(rawData)

    return NextResponse.json({
      projects,
      total: projects.length,
    })
  } catch (error) {
    logger.error('Error fetching small projects:', error)
    const { status, body } = getKaratFetchErrorResponseBody(error)
    return NextResponse.json(body, { status })
  }
}

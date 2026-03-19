import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { getNewsList, getNewsDetail } from '@/lib/news-server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')?.trim() ?? ''
    if (id) {
      const item = await getNewsDetail({ id })
      if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(item)
    }

    const items = await getNewsList()
    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      )
    }
    logger.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

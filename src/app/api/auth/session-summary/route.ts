import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Lightweight session summary endpoint for internal debugging/health checks.
// NOTE: This intentionally does NOT replace NextAuth's /api/auth/session.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
      },
      impersonation: (session as any).impersonation ?? { active: false },
      expires: session.expires,
    })
  } catch (error) {
    logger.error('Error getting session summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


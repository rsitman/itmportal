import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type StartBody = {
  targetUserId?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const adminId = (session?.user as any)?.id as string | undefined
    const adminEmail = session?.user?.email ?? undefined

    if (!session?.user || session.user.role !== 'ADMIN' || !adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if ((existingToken as any)?.impersonation?.active) {
      return NextResponse.json({ error: 'Already impersonating' }, { status: 409 })
    }

    const body = (await request.json().catch(() => ({}))) as StartBody
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : ''
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    if (targetUserId === adminId) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authProvider: true,
        isActive: true,
      },
    })

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!target.isActive) {
      return NextResponse.json({ error: 'Cannot impersonate inactive user' }, { status: 400 })
    }

    if (target.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot impersonate admin user' }, { status: 400 })
    }

    console.info('[impersonation] start', {
      at: new Date().toISOString(),
      admin: { id: adminId, email: adminEmail },
      target: { id: target.id, email: target.email, role: target.role, authProvider: target.authProvider },
    })

    return NextResponse.json({
      targetUser: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
        authProvider: target.authProvider,
      },
    })
  } catch (error) {
    console.error('[impersonation] start failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


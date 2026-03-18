import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const imp = (token as any)?.impersonation

    if (!imp?.active) {
      return NextResponse.json({ ok: true })
    }

    const originalUser = imp?.originalUser
    const targetUser = imp?.targetUser

    // Conservative guard: only allow stop if original identity is admin.
    if (!originalUser?.id || originalUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.info('[impersonation] stop', {
      at: new Date().toISOString(),
      admin: { id: originalUser.id, email: originalUser.email },
      target: targetUser ? { id: targetUser.id, email: targetUser.email, role: targetUser.role } : null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[impersonation] stop failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


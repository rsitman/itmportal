import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createHash } from 'crypto'
import { authOptions } from '@/lib/auth'

function maskSecret(value: string) {
  const trimmed = (value ?? '').toString()
  const len = trimmed.length
  if (!len) return { prefix: '', suffix: '' }
  const prefix = trimmed.slice(0, Math.min(3, len))
  const suffix = len > 6 ? trimmed.slice(-3) : ''
  return { prefix, suffix }
}

function fingerprint(value: string) {
  // Short stable fingerprint for safe comparisons.
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 12)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined

  // Admin-only: even fingerprints shouldn't be public.
  if (!session?.user || role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const raw = process.env.AZURE_AD_CLIENT_SECRET
  const exists = typeof raw === 'string' && raw.length > 0
  const len = exists ? raw!.length : 0
  const masked = exists ? maskSecret(raw!) : { prefix: '', suffix: '' }
  const fp = exists ? fingerprint(raw!) : null

  return NextResponse.json({
    env: 'AZURE_AD_CLIENT_SECRET',
    exists,
    length: len,
    masked: exists ? `${masked.prefix}…${masked.suffix}` : null,
    fingerprint: fp,
  })
}


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isProjectTeamSourceEnabled, refreshProjectTeamSnapshot } from '@/lib/search/person-project-team-snapshot'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((session.user as { role?: string } | undefined)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isProjectTeamSourceEnabled()) {
    return NextResponse.json({ ok: false, error: 'Feature flag SEARCH_PERSON_PROJECT_TEAM_ENABLED is OFF' }, { status: 412 })
  }

  const result = await refreshProjectTeamSnapshot()
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}

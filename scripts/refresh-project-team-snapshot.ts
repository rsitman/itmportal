import { isProjectTeamSourceEnabled, refreshProjectTeamSnapshot } from '@/lib/search/person-project-team-snapshot'

async function main() {
  const enabled = isProjectTeamSourceEnabled()
  if (!enabled) {
    console.error(
      'search:refresh-project-team-snapshot: SKIP (SEARCH_PERSON_PROJECT_TEAM_ENABLED is OFF)'
    )
    process.exitCode = 2
    return
  }

  const result = await refreshProjectTeamSnapshot()
  if (!result.ok) {
    console.error('search:refresh-project-team-snapshot: FAIL', result)
    process.exitCode = 1
    return
  }

  console.log('search:refresh-project-team-snapshot: OK', result)
}

main().catch((e) => {
  console.error('search:refresh-project-team-snapshot: ERROR', e)
  process.exitCode = 1
})


import type { PersonOrigin, PersonSearchResult, PersonSource } from '@/types/search'
import type { KaratProject } from '@/lib/karat'
import type { ProjectTeamSnapshotRecord } from '@/lib/search/person-project-team-snapshot'

type UpgradeRow = {
  projekt: string
  nazev: string
  verze: string
  datum_od: string
  datum_do: string
  resitel: string
  jira_klic: string
  stav: string
}

type ContactRow = {
  jmeno?: string
  prijmeni?: string
  email?: string
  role?: string
}

type ProjectContext = {
  projectId: string
  projectName?: string
  role?: string
}

type PersonCandidate = {
  source: PersonSource
  fullName: string
  firstName?: string
  lastName?: string
  email?: string
  roles: string[]
  teamOrDepartment?: string
  patchProjectsCount?: number
  upgradesCount?: number
  projectContexts?: ProjectContext[]
  personType?: number
}

type PersonAggregate = {
  fullName: string
  firstName?: string
  lastName?: string
  primaryEmail?: string
  roles: string[]
  teamOrDepartment?: string
  sources: Set<PersonSource>
  patchProjectsCount: number
  upgradesCount: number
  projectContexts: ProjectContext[]
  personType?: number
  trustedNameSignal: boolean
}

type PersonScoreResult = {
  score: number
  hasNameOrEmailMatch: boolean
}

const PERSON_FALLBACK_NAME = 'Neznámá osoba'

function collapseSpaces(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function normalizeForSearch(input: string): string {
  return collapseSpaces(
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  )
}

export function normalizeEmail(input?: string): string | null {
  if (!input) return null
  const trimmed = input.trim().toLowerCase()
  return trimmed || null
}

function cleanName(input?: string): string {
  if (!input) return ''
  const cleaned = collapseSpaces(input)
  if (cleaned === '-' || cleaned === '—') return ''
  return cleaned
}

function buildFullName(firstName?: string, lastName?: string, fallback?: string): string {
  const first = cleanName(firstName)
  const last = cleanName(lastName)
  const full = collapseSpaces([first, last].filter(Boolean).join(' '))
  if (full) return full
  return cleanName(fallback) || PERSON_FALLBACK_NAME
}

function splitFullName(fullName: string): { firstName?: string; lastName?: string } {
  const cleaned = cleanName(fullName)
  if (!cleaned) return {}
  const parts = cleaned.split(' ')
  if (parts.length === 1) return { firstName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function dedupeRoles(roles: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const role of roles) {
    const trimmed = collapseSpaces(role)
    if (!trimmed) continue
    const key = normalizeForSearch(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

function dedupeProjectContexts(contexts: ProjectContext[]): ProjectContext[] {
  const out: ProjectContext[] = []
  const seen = new Set<string>()
  for (const ctx of contexts) {
    const projectId = collapseSpaces(ctx.projectId)
    if (!projectId) continue
    const role = collapseSpaces(ctx.role ?? '')
    const key = `${projectId}::${normalizeForSearch(role)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ projectId, projectName: ctx.projectName, role: role || undefined })
  }
  return out
}

function toUpgradeArray(input: unknown): UpgradeRow[] {
  if (!Array.isArray(input)) return []
  const toStringSafe = (v: unknown): string => (typeof v === 'string' ? v : '')
  return input
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      projekt: toStringSafe(row.projekt),
      nazev: toStringSafe(row.nazev),
      verze: toStringSafe(row.verze),
      datum_od: toStringSafe(row.datum_od),
      datum_do: toStringSafe(row.datum_do),
      resitel: toStringSafe(row.resitel),
      jira_klic: toStringSafe(row.jira_klic),
      stav: toStringSafe(row.stav),
    }))
    .filter((u) => Boolean(u.projekt && u.nazev))
}

function buildPersonCandidates({
  contacts,
  patchProjects,
  upgradesRaw,
  projectTeamSnapshotPersons,
}: {
  contacts: ContactRow[]
  patchProjects: KaratProject[]
  upgradesRaw: unknown
  projectTeamSnapshotPersons?: ProjectTeamSnapshotRecord[]
}): PersonCandidate[] {
  const candidates: PersonCandidate[] = []

  for (const c of contacts) {
    const fullName = buildFullName(c.jmeno, c.prijmeni)
    if (!cleanName(fullName)) continue
    const roles = c.role ? c.role.split(',').map((r) => r.trim()) : []
    candidates.push({
      source: 'itman',
      fullName,
      firstName: cleanName(c.jmeno) || undefined,
      lastName: cleanName(c.prijmeni) || undefined,
      email: normalizeEmail(c.email) ?? undefined,
      roles: dedupeRoles(roles),
    })
  }

  for (const p of patchProjects) {
    const fullName = cleanName(p.accountManager ?? '')
    if (!fullName) continue
    const parsed = splitFullName(fullName)
    candidates.push({
      source: 'erp_patch',
      fullName,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      roles: ['Account manager'],
      patchProjectsCount: 1,
    })
  }

  for (const u of toUpgradeArray(upgradesRaw)) {
    const fullName = cleanName(u.resitel)
    if (!fullName) continue
    const parsed = splitFullName(fullName)
    candidates.push({
      source: 'erp_upgrade',
      fullName,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      roles: ['Řešitel upgradu'],
      upgradesCount: 1,
    })
  }

  for (const row of projectTeamSnapshotPersons ?? []) {
    const fullName = cleanName(row.fullName)
    if (!fullName) continue
    candidates.push({
      source: 'erp_project_team',
      fullName,
      firstName: cleanName(row.firstName) || undefined,
      lastName: cleanName(row.lastName) || undefined,
      email: normalizeEmail(row.email) ?? undefined,
      roles: row.role ? [row.role] : [],
      projectContexts: [{ projectId: row.projectId, projectName: row.projectName, role: row.role }],
      personType: row.personType,
    })
  }

  return candidates
}

function mergePersonCandidates(candidates: PersonCandidate[]): PersonAggregate[] {
  const byEmail = new Map<string, PersonAggregate>()
  const byNameTrusted = new Map<string, PersonAggregate>()
  const aggregates: PersonAggregate[] = []

  const isTrustedForNameMerge = (candidate: PersonCandidate): boolean =>
    candidate.source === 'itman' || candidate.source === 'erp_project_team'

  const ensureAggregate = (candidate: PersonCandidate): PersonAggregate => {
    const emailNorm = normalizeEmail(candidate.email)
    const nameNorm = normalizeForSearch(candidate.fullName)
    if (emailNorm && byEmail.has(emailNorm)) return byEmail.get(emailNorm)!

    const trustedCandidate = isTrustedForNameMerge(candidate)
    if (trustedCandidate && byNameTrusted.has(nameNorm)) return byNameTrusted.get(nameNorm)!

    const aggregate: PersonAggregate = {
      fullName: candidate.fullName,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      primaryEmail: emailNorm ?? undefined,
      roles: dedupeRoles(candidate.roles),
      teamOrDepartment: candidate.teamOrDepartment,
      sources: new Set<PersonSource>([candidate.source]),
      patchProjectsCount: candidate.patchProjectsCount ?? 0,
      upgradesCount: candidate.upgradesCount ?? 0,
      projectContexts: dedupeProjectContexts(candidate.projectContexts ?? []),
      personType: candidate.personType,
      trustedNameSignal: trustedCandidate,
    }
    aggregates.push(aggregate)
    if (emailNorm) byEmail.set(emailNorm, aggregate)
    if (trustedCandidate) byNameTrusted.set(nameNorm, aggregate)
    return aggregate
  }

  for (const candidate of candidates) {
    const aggregate = ensureAggregate(candidate)
    aggregate.sources.add(candidate.source)
    aggregate.roles = dedupeRoles([...aggregate.roles, ...candidate.roles])
    aggregate.patchProjectsCount += candidate.patchProjectsCount ?? 0
    aggregate.upgradesCount += candidate.upgradesCount ?? 0
    aggregate.projectContexts = dedupeProjectContexts([...aggregate.projectContexts, ...(candidate.projectContexts ?? [])])
    if (!aggregate.primaryEmail) aggregate.primaryEmail = normalizeEmail(candidate.email) ?? undefined
    if (!aggregate.teamOrDepartment && candidate.teamOrDepartment) aggregate.teamOrDepartment = candidate.teamOrDepartment
    if (aggregate.personType === undefined && candidate.personType !== undefined) aggregate.personType = candidate.personType
    if (isTrustedForNameMerge(candidate)) {
      aggregate.trustedNameSignal = true
      byNameTrusted.set(normalizeForSearch(aggregate.fullName), aggregate)
    }
  }

  return aggregates
}

function getOrigin(sources: Set<PersonSource>): PersonOrigin {
  const hasItman = sources.has('itman')
  const hasErp = [...sources].some((s) => s !== 'itman')
  if (hasItman && hasErp) return 'mixed'
  if (hasItman) return 'itman'
  return 'erp'
}

function buildProjectContextSnippet(person: PersonAggregate): string | undefined {
  if (person.projectContexts.length === 0) return undefined
  const top = person.projectContexts.slice(0, 2)
  const names = top.map((ctx) => ctx.projectName || ctx.projectId)
  const suffix = person.projectContexts.length > 2 ? ` +${person.projectContexts.length - 2}` : ''
  return `Projektový tým: ${names.join(', ')}${suffix}`
}

function buildPersonContextSnippet(person: PersonAggregate): string {
  const parts: string[] = []
  if (person.upgradesCount > 0) parts.push(`Řešitel v ${person.upgradesCount} upgradech`)
  if (person.patchProjectsCount > 0) parts.push(`Account manager v ${person.patchProjectsCount} projektech patchování`)
  const projectContext = buildProjectContextSnippet(person)
  if (projectContext) parts.push(projectContext)
  if (parts.length === 0 && person.sources.has('itman')) parts.push('Osoba nalezena v interních kontaktech')
  if (parts.length === 0 && person.roles.length > 0) parts.push(`Role: ${person.roles.slice(0, 2).join(', ')}`)
  return parts.join(' · ')
}

function isSingleWordQuery(qNorm: string): boolean {
  return qNorm.length > 0 && !qNorm.includes(' ')
}

function isShortSurnameLikeQuery(qNorm: string): boolean {
  return isSingleWordQuery(qNorm) && qNorm.length <= 6 && !qNorm.includes('@')
}

function scorePersonMatch(person: PersonAggregate, qNorm: string): PersonScoreResult {
  if (!qNorm) return { score: 0, hasNameOrEmailMatch: false }
  const nameNorm = normalizeForSearch(person.fullName)
  const firstNorm = normalizeForSearch(person.firstName ?? '')
  const lastNorm = normalizeForSearch(person.lastName ?? '')
  const nameTokens = nameNorm.split(' ').filter(Boolean)
  const emailNorm = normalizeEmail(person.primaryEmail) ?? ''
  const rolesNorm = person.roles.map((r) => normalizeForSearch(r))
  const teamNorm = normalizeForSearch(person.teamOrDepartment ?? '')
  const projectTokens = person.projectContexts
    .flatMap((ctx) => [ctx.projectName ?? '', ctx.projectId, ctx.role ?? ''])
    .map((v) => normalizeForSearch(v))
    .filter(Boolean)
  const singleWord = isSingleWordQuery(qNorm)
  const shortSurnameLike = isShortSurnameLikeQuery(qNorm)

  let score = 0
  let hasNameOrEmailMatch = false

  if (nameNorm === qNorm) { score += 120; hasNameOrEmailMatch = true }
  if (emailNorm && emailNorm === qNorm) { score += 110; hasNameOrEmailMatch = true }
  if (singleWord && lastNorm && lastNorm === qNorm) { score += 140; hasNameOrEmailMatch = true }
  if (singleWord && nameTokens.some((t) => t === qNorm)) { score += 130; hasNameOrEmailMatch = true }
  if (nameNorm.startsWith(qNorm)) { score += 90; hasNameOrEmailMatch = true }
  if ((firstNorm && firstNorm.startsWith(qNorm)) || (lastNorm && lastNorm.startsWith(qNorm))) { score += 80; hasNameOrEmailMatch = true }
  if (singleWord && nameTokens.some((t) => t.startsWith(qNorm))) { score += 100; hasNameOrEmailMatch = true }
  if (nameNorm.includes(qNorm)) { score += 60; hasNameOrEmailMatch = true }
  if (emailNorm && emailNorm.includes(qNorm)) { score += 55; hasNameOrEmailMatch = true }

  const roleMatch = rolesNorm.some((r) => r.includes(qNorm))
  const teamMatch = Boolean(teamNorm && teamNorm.includes(qNorm))
  const projectContextMatch = projectTokens.some((t) => t.includes(qNorm))
  const allowWeakContextBoost = !shortSurnameLike || hasNameOrEmailMatch
  if (allowWeakContextBoost && roleMatch) score += 35
  if (allowWeakContextBoost && teamMatch) score += 25
  if (allowWeakContextBoost && projectContextMatch) score += 18
  if (hasNameOrEmailMatch && person.sources.has('erp_project_team')) score += 12
  if (person.sources.size > 1) score += 20
  if (emailNorm) score += 15
  if (!emailNorm && person.roles.length === 0) score -= 20
  return { score, hasNameOrEmailMatch }
}

function resolvePrimaryPersonUrl(person: PersonAggregate): string {
  const queryValue = person.primaryEmail || person.fullName
  const encodedQueryValue = encodeURIComponent(queryValue)
  const encodedName = encodeURIComponent(person.fullName)
  const origin = getOrigin(person.sources)
  const hasProjectTeam = person.sources.has('erp_project_team')
  const isExternal = person.personType === 10 || person.personType === 20
  if ((origin === 'itman' || origin === 'mixed') && !isExternal) {
    return `/osoby-itman?search=${encodedQueryValue}`
  }
  if (hasProjectTeam) {
    const dominantProject = person.projectContexts[0]
    if (dominantProject?.projectId) {
      return `/projects/doklad-projektu/${encodeURIComponent(dominantProject.projectId)}/team`
    }
    return `/search?q=${encodedName}`
  }
  if (person.sources.has('erp_patch')) return `/plan_patchovani?osoba=${encodedName}`
  if (person.sources.has('erp_upgrade')) return `/upgrades?osoba=${encodedName}`
  return `/search?q=${encodedName}`
}

function sourcePriority(source: PersonSource): number {
  if (source === 'itman') return 4
  if (source === 'erp_project_team') return 3
  if (source === 'erp_patch') return 2
  if (source === 'erp_upgrade') return 1
  return 0
}

function toPersonSearchResult(person: PersonAggregate): PersonSearchResult {
  const origin = getOrigin(person.sources)
  const normalizedEmail = normalizeEmail(person.primaryEmail)
  const nameNorm = normalizeForSearch(person.fullName)
  const topSource = [...person.sources].sort((a, b) => sourcePriority(b) - sourcePriority(a))[0] ?? 'itman'
  const personKey = normalizedEmail ? `person:email:${normalizedEmail}` : `person:name:${nameNorm}:${topSource}`
  const primaryUrl = resolvePrimaryPersonUrl(person)
  const roleSummary = person.roles.length > 2 ? `${person.roles.slice(0, 2).join(', ')} +${person.roles.length - 2}` : person.roles.join(', ')
  const projectSummary = person.projectContexts.length > 0
    ? (() => {
        const top = person.projectContexts.slice(0, 2)
        const names = top.map((ctx) => ctx.projectName || ctx.projectId).filter(Boolean)
        const suffix = person.projectContexts.length > 2 ? ` +${person.projectContexts.length - 2}` : ''
        return names.length > 0 ? `Tým: ${names.join(', ')}${suffix}` : undefined
      })()
    : undefined
  const subtitleParts = [roleSummary, projectSummary, person.teamOrDepartment, normalizedEmail].filter(Boolean) as string[]
  const isExternal = person.personType === 10 || person.personType === 20

  return {
    type: 'person',
    id: personKey,
    personKey,
    origin,
    sources: [...person.sources],
    fullName: person.fullName,
    firstName: person.firstName,
    lastName: person.lastName,
    primaryEmail: normalizedEmail ?? undefined,
    roles: person.roles,
    teamOrDepartment: person.teamOrDepartment,
    primaryUrl,
    contextSnippet: buildPersonContextSnippet(person),
    personType: person.personType,
    title: person.fullName,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
    snippet: buildPersonContextSnippet(person),
    url: primaryUrl,
    metadata: {
      origin,
      sources: [...person.sources],
      rawSource: person.sources.has('itman') ? 'web/contacts' : undefined,
      externalMarker: isExternal || undefined,
      projectContexts: person.projectContexts.slice(0, 3),
      secondaryUrls: [
        ...(origin === 'mixed'
          ? [{ label: 'Osoby ITMAN', url: `/osoby-itman?search=${encodeURIComponent(person.primaryEmail || person.fullName)}` }]
          : []),
        ...person.projectContexts.slice(0, 3).map((ctx) => ({
          label: ctx.projectName ? `Projekt: ${ctx.projectName}` : `Projekt: ${ctx.projectId}`,
          url: `/projects/doklad-projektu/${encodeURIComponent(ctx.projectId)}/team`,
        })),
        ...(person.sources.has('erp_upgrade') ? [{ label: 'Upgrady', url: `/upgrades?osoba=${encodeURIComponent(person.fullName)}` }] : []),
        ...(person.sources.has('erp_patch') ? [{ label: 'Patchování', url: `/plan_patchovani?osoba=${encodeURIComponent(person.fullName)}` }] : []),
      ],
    },
  }
}

export function buildPersonResults({
  contacts,
  patchProjects,
  upgradesRaw,
  projectTeamSnapshotPersons = [],
  query,
  maxResults,
}: {
  contacts: ContactRow[]
  patchProjects: KaratProject[]
  upgradesRaw: unknown
  projectTeamSnapshotPersons?: ProjectTeamSnapshotRecord[]
  query: string
  maxResults: number
}): PersonSearchResult[] {
  const qNorm = normalizeForSearch(query)
  if (!qNorm) return []
  const candidates = buildPersonCandidates({ contacts, patchProjects, upgradesRaw, projectTeamSnapshotPersons })
  const merged = mergePersonCandidates(candidates)
  const scored = merged
    .map((person) => ({ person, ...scorePersonMatch(person, qNorm) }))
    .filter((entry) => {
      if (entry.score <= 0) return false
      const shortSurnameLike = isShortSurnameLikeQuery(qNorm)
      const minThreshold = shortSurnameLike ? 100 : 40
      if (entry.score < minThreshold) return false
      if (shortSurnameLike && !entry.hasNameOrEmailMatch) return false
      return true
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const originRank = (origin: PersonOrigin) => (origin === 'mixed' ? 3 : origin === 'itman' ? 2 : 1)
      const originCmp = originRank(getOrigin(b.person.sources)) - originRank(getOrigin(a.person.sources))
      if (originCmp !== 0) return originCmp
      const topSourceA = [...a.person.sources].sort((x, y) => sourcePriority(y) - sourcePriority(x))[0] ?? 'erp_upgrade'
      const topSourceB = [...b.person.sources].sort((x, y) => sourcePriority(y) - sourcePriority(x))[0] ?? 'erp_upgrade'
      const sourceCmp = sourcePriority(topSourceB) - sourcePriority(topSourceA)
      if (sourceCmp !== 0) return sourceCmp
      if (b.person.sources.size !== a.person.sources.size) return b.person.sources.size - a.person.sources.size
      return a.person.fullName.localeCompare(b.person.fullName, 'cs')
    })

  // React key in UI is based on `SearchResultItem.id` -> must be unique.
  // With conservative merging, multiple candidates can produce the same `personKey` (id),
  // e.g. repeated `erp_patch` names without email. Deduplicate by `id` while keeping score order.
  const out: PersonSearchResult[] = []
  const seen = new Set<string>()
  for (const entry of scored) {
    const res = toPersonSearchResult(entry.person)
    if (seen.has(res.id)) continue
    seen.add(res.id)
    out.push(res)
    if (out.length >= maxResults) break
  }
  return out
}

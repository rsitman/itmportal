import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

const SNAPSHOT_PATH = path.join(process.cwd(), 'data', 'search', 'person-project-team-snapshot.json')
const SNAPSHOT_DIR = path.dirname(SNAPSHOT_PATH)
const TMP_SNAPSHOT_PATH = `${SNAPSHOT_PATH}.tmp`

const DEFAULT_REFRESH_INTERVAL_MS = 60 * 60 * 1000
const HARD_STALE_CUTOFF_MS = 24 * 60 * 60 * 1000
const SOFT_STALE_WARNING_MS = 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000
const DEFAULT_FETCH_CONCURRENCY = 6
const SCHEMA_VERSION = 1

export type ProjectTeamSnapshotRecord = {
  projectId: string
  projectName?: string
  fullName: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  personType?: number
}

type ProjectTeamSnapshot = {
  generatedAt: string
  lastSuccessAt: string
  lastAttemptAt: string
  schemaVersion: number
  projectsScanned: number
  personsCount: number
  staleAfterMs: number
  records: ProjectTeamSnapshotRecord[]
}

type CacheState = {
  snapshot: ProjectTeamSnapshot | null
  loadedAt: number
}

const cache: CacheState = {
  snapshot: null,
  loadedAt: 0,
}

let lastSoftStaleWarnAt = 0
const SOFT_STALE_WARN_COOLDOWN_MS = 5 * 60 * 1000

function normalizeErpBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/web') ? trimmed.slice(0, -4) : trimmed
}

function cleanText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim()
}

function cleanEmail(input: unknown): string | undefined {
  const email = cleanText(input).toLowerCase()
  return email || undefined
}

function buildFullName(firstName: string, lastName: string): string {
  return [cleanText(firstName), cleanText(lastName)].filter(Boolean).join(' ').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

async function fetchProjectList(erpBase: string): Promise<Array<{ projectId: string; projectName?: string }>> {
  const res = await fetch(`${erpBase}/web/projects`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Projects fetch failed: ${res.status}`)
  const raw = await res.json()
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p): p is Record<string, unknown> => isRecord(p))
    .map((p) => ({
      projectId: cleanText(p.projekt),
      projectName: cleanText(p.nazev) || undefined,
    }))
    .filter((p) => Boolean(p.projectId))
}

async function fetchProjectTeam(erpBase: string, projectId: string): Promise<unknown[]> {
  const res = await fetch(`${erpBase}/web/projects/${encodeURIComponent(projectId)}/pers`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) return []
  const raw = await res.json()
  return Array.isArray(raw) ? raw : []
}

function mapTeamRowsToRecords(rows: unknown[], projectId: string, projectName?: string): ProjectTeamSnapshotRecord[] {
  const mapped: ProjectTeamSnapshotRecord[] = []
  for (const row of rows) {
    if (!isRecord(row)) continue
    const firstName = cleanText(row.jmeno)
    const lastName = cleanText(row.prijmeni)
    const fullName = buildFullName(firstName, lastName)
    if (!fullName) continue
    mapped.push({
      projectId,
      projectName,
      fullName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: cleanEmail(row.email),
      role: cleanText(row.nazev_role) || undefined,
      personType: typeof row.typ_osoby === 'number' ? row.typ_osoby : undefined,
    })
  }
  return mapped
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = new Array(Math.max(1, limit)).fill(null).map(async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) break
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

async function writeSnapshotAtomic(snapshot: ProjectTeamSnapshot): Promise<void> {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true })
  await fs.writeFile(TMP_SNAPSHOT_PATH, JSON.stringify(snapshot), 'utf8')
  await fs.rename(TMP_SNAPSHOT_PATH, SNAPSHOT_PATH)
}

function isSnapshotShape(data: unknown): data is ProjectTeamSnapshot {
  if (!isRecord(data)) return false
  if (typeof data.schemaVersion !== 'number') return false
  if (!Array.isArray(data.records)) return false
  return true
}

function getAgeMs(isoDate: string): number {
  const ts = new Date(isoDate).getTime()
  if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY
  return Date.now() - ts
}

function shouldIgnoreAsHardStale(snapshot: ProjectTeamSnapshot): boolean {
  return getAgeMs(snapshot.generatedAt) > HARD_STALE_CUTOFF_MS
}

function getFetchConcurrency(): number {
  const raw = Number(process.env.SEARCH_PERSON_PROJECT_TEAM_FETCH_CONCURRENCY ?? DEFAULT_FETCH_CONCURRENCY)
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_FETCH_CONCURRENCY
  return Math.min(20, Math.floor(raw))
}

function warnSoftStaleOnce(message: string): void {
  const now = Date.now()
  if (now - lastSoftStaleWarnAt < SOFT_STALE_WARN_COOLDOWN_MS) return
  lastSoftStaleWarnAt = now
  logger.warn(message)
}

export async function refreshProjectTeamSnapshot(): Promise<{
  ok: boolean
  projectsScanned: number
  personsCount: number
  error?: string
}> {
  const nowIso = new Date().toISOString()
  try {
    const erpBase = normalizeErpBaseUrl(process.env.ERP_API_URL || 'http://itmsql01:44612')
    const projects = await fetchProjectList(erpBase)
    const teams = await mapWithConcurrency(projects, getFetchConcurrency(), async (project) => {
      try {
        const rows = await fetchProjectTeam(erpBase, project.projectId)
        return mapTeamRowsToRecords(rows, project.projectId, project.projectName)
      } catch (e) {
        logger.warn('Project team refresh: failed project team fetch', project.projectId, e)
        return []
      }
    })

    const records = teams.flat()
    const snapshot: ProjectTeamSnapshot = {
      generatedAt: nowIso,
      lastSuccessAt: nowIso,
      lastAttemptAt: nowIso,
      schemaVersion: SCHEMA_VERSION,
      projectsScanned: projects.length,
      personsCount: records.length,
      staleAfterMs: DEFAULT_REFRESH_INTERVAL_MS,
      records,
    }

    await writeSnapshotAtomic(snapshot)
    cache.snapshot = snapshot
    cache.loadedAt = Date.now()
    logger.info('Project team refresh: success', {
      projectsScanned: snapshot.projectsScanned,
      personsCount: snapshot.personsCount,
    })
    return { ok: true, projectsScanned: snapshot.projectsScanned, personsCount: snapshot.personsCount }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown refresh error'
    logger.error('Project team refresh: failed', e)
    return { ok: false, projectsScanned: 0, personsCount: 0, error: message }
  }
}

async function readSnapshotFromFile(): Promise<ProjectTeamSnapshot | null> {
  try {
    const data = await fs.readFile(SNAPSHOT_PATH, 'utf8')
    const parsed: unknown = JSON.parse(data)
    if (!isSnapshotShape(parsed)) {
      logger.warn('Project team snapshot: invalid snapshot shape')
      return null
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      logger.warn('Project team snapshot: incompatible schema version', parsed.schemaVersion)
      return null
    }
    return parsed
  } catch (e) {
    logger.warn('Project team snapshot: load failed', e)
    return null
  }
}

export async function loadProjectTeamSnapshotRecords(): Promise<ProjectTeamSnapshotRecord[]> {
  const fromCache = cache.snapshot
  if (fromCache) {
    if (shouldIgnoreAsHardStale(fromCache)) {
      logger.warn('Project team snapshot: hard stale in cache, ignoring')
      cache.snapshot = null
      return []
    }
    if (getAgeMs(fromCache.generatedAt) > SOFT_STALE_WARNING_MS) {
      warnSoftStaleOnce('Project team snapshot: soft stale cache snapshot in use')
    }
    return fromCache.records
  }

  const fromFile = await readSnapshotFromFile()
  if (!fromFile) return []
  if (shouldIgnoreAsHardStale(fromFile)) {
    logger.warn('Project team snapshot: hard stale file snapshot ignored')
    return []
  }
  if (getAgeMs(fromFile.generatedAt) > SOFT_STALE_WARNING_MS) {
    warnSoftStaleOnce('Project team snapshot: soft stale file snapshot in use')
  }
  cache.snapshot = fromFile
  cache.loadedAt = Date.now()
  return fromFile.records
}

export function isProjectTeamSourceEnabled(): boolean {
  const raw = (process.env.SEARCH_PERSON_PROJECT_TEAM_ENABLED ?? '').toLowerCase().trim()
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}


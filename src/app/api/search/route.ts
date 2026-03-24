import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { htmlToPlainText, htmlToPlainTextExcerpt } from '@/lib/text-excerpt'
import { computeErpNewsId } from '@/lib/news-id'
import { mapKaratProjects } from '@/lib/karat'
import { buildPersonResults } from '@/lib/search/person-search'

const MAX_PROJECTS = 5
const MAX_NEWS = 3
const MAX_PATCH = 5
const MAX_UPGRADES = 5
const MAX_DATABASES = 5
const MAX_PERSONS = 8

function normalizeErpBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, '')
  return trimmed.endsWith('/web') ? trimmed.slice(0, -4) : trimmed
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    const qLower = q.toLowerCase()

    const erpBase = normalizeErpBaseUrl(process.env.ERP_API_URL || 'http://itmsql01:44612')
    const returnTo = `/search?q=${encodeURIComponent(q)}`

    if (!q) {
      return NextResponse.json({ results: [] })
    }

    const projectsPromise: Promise<Array<{ doklad_proj: string; nazev: string; jira_klic: string; nazev_par: string; gps: string }>> =
      (async () => {
      try {
        const projectsRes = await fetch(`${erpBase}/web/projects`, {
          signal: AbortSignal.timeout(8000),
        })
        if (!projectsRes.ok) return []
        const raw = await projectsRes.json()
        return Array.isArray(raw)
          ? raw.map((p: Record<string, unknown>) => ({
              doklad_proj: String(p.projekt ?? ''),
              nazev: String(p.nazev ?? ''),
              jira_klic: String(p.jira_klic ?? ''),
              nazev_par: String(p.nazev_par ?? ''),
              gps: String(p.gps ?? ''),
            }))
          : []
      } catch (e) {
        logger.error('Search: failed to fetch projects', e)
        return []
      }
    })()

    const newsPromise: Promise<Array<{ nadpis?: string; obsah?: string; projekt?: string; projekt_nazev?: string }>> =
      (async () => {
      try {
        const newsRes = await fetch(`${erpBase}/web/news`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!newsRes.ok) return []
        const data = await newsRes.json()
        return Array.isArray(data) ? (data as Array<{ nadpis?: string; obsah?: string; projekt?: string; projekt_nazev?: string }>) : []
      } catch (e) {
        logger.error('Search: failed to fetch news', e)
        return []
      }
    })()

    const patchProjectsPromise: Promise<unknown[]> = (async () => {
      try {
        const patchRes = await fetch(`${erpBase}/web/patchovani_data`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!patchRes.ok) return []
        const data = await patchRes.json()
        return Array.isArray(data) ? data : []
      } catch (e) {
        logger.error('Search: failed to fetch patchovani_data', e)
        return []
      }
    })()

    const upgradesPromise: Promise<unknown[]> = (async () => {
      try {
        const upgradesRes = await fetch(`${erpBase}/web/upgrades`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!upgradesRes.ok) return []
        const data = await upgradesRes.json()
        return Array.isArray(data) ? data : []
      } catch (e) {
        logger.error('Search: failed to fetch upgrades', e)
        return []
      }
    })()

    const databasesPromise: Promise<unknown[]> = (async () => {
      try {
        const dbRes = await fetch(`${erpBase}/web/databases`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!dbRes.ok) return []
        const data = await dbRes.json()
        return Array.isArray(data) ? data : []
      } catch (e) {
        logger.error('Search: failed to fetch databases', e)
        return []
      }
    })()

    const contactsPromise: Promise<Array<{ jmeno?: string; prijmeni?: string; email?: string; role?: string }>> = (async () => {
      try {
        const contactsRes = await fetch(`${erpBase}/web/contacts`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!contactsRes.ok) return []
        const data = await contactsRes.json()
        return Array.isArray(data) ? data : []
      } catch (e) {
        logger.error('Search: failed to fetch contacts', e)
        return []
      }
    })()

    const [projects, newsRaw, patchProjects, upgradesRaw, databasesRaw, contactsRaw] = await Promise.all([
      projectsPromise,
      newsPromise,
      patchProjectsPromise,
      upgradesPromise,
      databasesPromise,
      contactsPromise,
    ])

    // Filter projects: contains match (case-insensitive) on name, company, doklad, jira
    const projectMatches = qLower
      ? projects.filter(
          (p) =>
            p.nazev.toLowerCase().includes(qLower) ||
            p.nazev_par.toLowerCase().includes(qLower) ||
            p.doklad_proj.toLowerCase().includes(qLower) ||
            p.jira_klic.toLowerCase().includes(qLower)
        )
      : []

    const projectResults = projectMatches.slice(0, MAX_PROJECTS).map((p) => ({
      type: 'project' as const,
      id: p.doklad_proj || p.nazev,
      title: p.nazev,
      subtitle: `${p.nazev_par}${p.jira_klic ? ` · ${p.jira_klic}` : ''}`,
      snippet: p.doklad_proj ? `Projekt: ${p.doklad_proj}` : undefined,
      url: `/projects/doklad-projektu/${encodeURIComponent(p.doklad_proj)}`,
      metadata: {
        dokladProj: p.doklad_proj,
        companyName: p.nazev_par,
        jiraKey: p.jira_klic,
      },
    }))

    // Filter news: contains on title, content (plain text), project name
    const newsMatches = qLower
      ? newsRaw.filter((n) => {
          const nadpis = (n.nadpis ?? '').toLowerCase()
          const obsah = htmlToPlainText(n.obsah ?? '').toLowerCase()
          const projektNazev = (n.projekt_nazev ?? '').toLowerCase()
          return (
            nadpis.includes(qLower) ||
            obsah.includes(qLower) ||
            projektNazev.includes(qLower)
          )
        })
      : []

    const newsResults = newsMatches.slice(0, MAX_NEWS).map((n) => {
      const newsId = computeErpNewsId(n)
      const snippet = htmlToPlainTextExcerpt(n.obsah ?? '', 100)
      const projectName = n.projekt_nazev ?? undefined
      return {
        type: 'news' as const,
        id: newsId,
        title: n.nadpis ?? '',
        subtitle: projectName ? projectName : undefined,
        snippet,
        url: `/aktuality/${encodeURIComponent(newsId)}`,
        metadata: {
          projectName: n.projekt_nazev,
        },
      }
    })

    const formatCsDate = (d: Date | null | undefined): string | undefined => {
      if (!d) return undefined
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined
      return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const patchProjectsMapped = mapKaratProjects(patchProjects as Parameters<typeof mapKaratProjects>[0])
    const patchMatches = qLower
      ? patchProjectsMapped.filter((p) => {
          const fields = [
            p.projectName,
            p.companyName,
            p.projectId,
            p.accountManager,
            p.jiraKey,
            p.country,
          ]
          return fields.some((v) => (v ?? '').toLowerCase().includes(qLower))
        })
      : []

    const patchResults = patchMatches.slice(0, MAX_PATCH).map((p) => {
      const next = formatCsDate(p.nextPlannedPatchDate)
      const last = formatCsDate(p.lastInstalledPatchDate)

      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      if (p.projectId) qs.set('projekt', p.projectId)
      if (p.accountManager) qs.set('osoba', p.accountManager)
      qs.set('returnTo', returnTo)

      return {
        type: 'patch' as const,
        id: `${p.projectId}:${p.companyId}`,
        title: p.projectName || '—',
        subtitle: `${p.companyName || '—'}${p.jiraKey ? ` · ${p.jiraKey}` : ''}`,
        snippet:
          [next ? `Plán: ${next}` : null, last ? `Posl. instalace: ${last}` : null].filter(Boolean).join(' · ') ||
          undefined,
        url: `/plan_patchovani?${qs.toString()}`,
        metadata: {
          projectId: p.projectId,
          companyId: p.companyId,
          companyName: p.companyName,
          accountManager: p.accountManager,
          jiraKey: p.jiraKey,
          country: p.country,
          nextPlannedPatchDate: next,
          lastInstalledPatchDate: last,
          hasNewPatch: p.hasNewPatch,
          hasNewLegalPatch: p.hasNewLegalPatch,
          hasServicePatch: p.hasServicePatch,
        },
      }
    })

    const toUpgradeArray = (input: unknown): Array<{
      projekt: string
      nazev: string
      verze: string
      datum_od: string
      datum_do: string
      resitel: string
      jira_klic: string
      stav: string
    }> => {
      if (!Array.isArray(input)) return []
      const toStringSafe = (v: unknown): string => (typeof v === 'string' ? v : '')

      const rows = input.filter((row): row is Record<string, unknown> => row && typeof row === 'object')
      return rows
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
        .filter((u) => u.projekt && u.nazev)
    }

    const upgradesMapped = toUpgradeArray(upgradesRaw)
    const upgradeMatches = qLower
      ? upgradesMapped.filter((u) => {
          const fields = [u.nazev, u.projekt, u.resitel, u.jira_klic, u.verze, u.stav]
          return fields.some((v) => (v ?? '').toLowerCase().includes(qLower))
        })
      : []

    const upgradeResults = upgradeMatches.slice(0, MAX_UPGRADES).map((u) => {
      const qs = new URLSearchParams()
      if (u.projekt) qs.set('projekt', u.projekt)
      if (u.resitel) qs.set('osoba', u.resitel)
      qs.set('returnTo', returnTo)
      return {
        type: 'upgrade' as const,
        id: `${u.projekt}:${u.jira_klic}:${u.datum_od}`,
        title: u.nazev || '—',
        subtitle: `${u.projekt || '—'}${u.verze ? ` · ${u.verze}` : ''}${u.stav ? ` · ${u.stav}` : ''}`,
        snippet: [`Řešitel: ${u.resitel || '—'}`, `JIRA: ${u.jira_klic || '—'}`].join(' · '),
        url: `/upgrades?${qs.toString()}`,
        metadata: {
          projekt: u.projekt,
          verze: u.verze,
          resitel: u.resitel,
          jira_klic: u.jira_klic,
          stav: u.stav,
        },
      }
    })

    const databaseRows = databasesRaw.filter(
      (d): d is Record<string, unknown> => d !== null && typeof d === 'object',
    )

    const getDbField = (d: Record<string, unknown>, key: string): string => String(d[key] ?? '')

    const databaseMatches = qLower
      ? databaseRows.filter((d) => {
          const fields = [
            getDbField(d, 'databaze'),
            getDbField(d, 'firma_nazev'),
            getDbField(d, 'projekt'),
            getDbField(d, 'id_firmy'),
            getDbField(d, 'verze'),
            getDbField(d, 'recovery_model'),
            getDbField(d, 'collation_name'),
            getDbField(d, 'compatibility_level'),
          ]
          return fields.some((v) => v.toLowerCase().includes(qLower))
        })
      : []

    const databaseResults = databaseMatches.slice(0, MAX_DATABASES).map((d) => {
      const projekt = getDbField(d, 'projekt')
      const qs = new URLSearchParams()
      if (projekt) qs.set('projekt', projekt)
      qs.set('returnTo', returnTo)
      return {
        type: 'database' as const,
        id: `${getDbField(d, 'projekt')}:${getDbField(d, 'id_firmy')}:${getDbField(d, 'databaze')}`,
        title: getDbField(d, 'databaze') || '—',
        subtitle: `${getDbField(d, 'firma_nazev') || '—'} · ${projekt || '—'}`,
        snippet: [
          `Verze: ${getDbField(d, 'verze') || '—'}`,
          `Recovery: ${getDbField(d, 'recovery_model') || '—'}`,
          `Compatibility: ${getDbField(d, 'compatibility_level') || '—'}`,
        ].join(' · '),
        url: `/databases?${qs.toString()}`,
        metadata: {
          databaze: getDbField(d, 'databaze'),
          firma_nazev: getDbField(d, 'firma_nazev'),
          projekt: getDbField(d, 'projekt'),
          id_firmy: getDbField(d, 'id_firmy'),
          verze: getDbField(d, 'verze'),
          recovery_model: getDbField(d, 'recovery_model'),
          collation_name: getDbField(d, 'collation_name'),
          compatibility_level: getDbField(d, 'compatibility_level'),
        },
      }
    })

    const personResults = buildPersonResults({
      contacts: contactsRaw,
      patchProjects: patchProjectsMapped,
      upgradesRaw,
      query: q,
      maxResults: MAX_PERSONS,
    })

    return NextResponse.json({
      results: [
        ...projectResults,
        ...personResults,
        ...newsResults,
        ...patchResults,
        ...upgradeResults,
        ...databaseResults,
      ],
    })
  } catch (error) {
    logger.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search', results: [] },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { htmlToPlainText, htmlToPlainTextExcerpt } from '@/lib/text-excerpt'
import { computeErpNewsId } from '@/lib/news-id'

const MAX_PROJECTS = 5
const MAX_NEWS = 3

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

    // Fetch projects (same source as /api/service-projects)
    let projects: Array<{ doklad_proj: string; nazev: string; jira_klic: string; nazev_par: string; gps: string }> = []
    try {
      const projectsRes = await fetch(`${erpBase}/web/projects`, {
        signal: AbortSignal.timeout(8000),
      })
      if (projectsRes.ok) {
        const raw = await projectsRes.json()
        projects = Array.isArray(raw)
          ? raw.map((p: Record<string, unknown>) => ({
              doklad_proj: String(p.projekt ?? ''),
              nazev: String(p.nazev ?? ''),
              jira_klic: String(p.jira_klic ?? ''),
              nazev_par: String(p.nazev_par ?? ''),
              gps: String(p.gps ?? ''),
            }))
          : []
      }
    } catch (e) {
      logger.error('Search: failed to fetch projects', e)
    }

    // Fetch news (same source as /api/news)
    let newsRaw: Array<{ nadpis?: string; obsah?: string; projekt?: string; projekt_nazev?: string }> = []
    try {
      const newsRes = await fetch(`${erpBase}/web/news`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (newsRes.ok) {
        const data = await newsRes.json()
        newsRaw = Array.isArray(data) ? data : []
      }
    } catch (e) {
      logger.error('Search: failed to fetch news', e)
    }

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
      id: p.doklad_proj || p.nazev,
      name: p.nazev,
      companyName: p.nazev_par,
      dokladProj: p.doklad_proj,
      jiraKey: p.jira_klic,
      url: `/projects/doklad-projektu/${encodeURIComponent(p.doklad_proj)}`,
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

    const newsResults = newsMatches.slice(0, MAX_NEWS).map((n, idx) => {
      const newsId = computeErpNewsId(n)
      const snippet = htmlToPlainTextExcerpt(n.obsah ?? '', 100)
      return {
        id: newsId,
        title: n.nadpis ?? '',
        snippet,
        projectName: n.projekt_nazev ?? undefined,
        url: `/aktuality/${encodeURIComponent(newsId)}`,
      }
    })

    return NextResponse.json({
      projects: projectResults,
      news: newsResults,
    })
  } catch (error) {
    logger.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search', projects: [], news: [] },
      { status: 500 }
    )
  }
}

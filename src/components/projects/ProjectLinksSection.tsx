'use client'

import { useCallback, useEffect, useState } from 'react'
import { ProjectLink } from '@/types/project'
import { logger } from '@/lib/logger'

function truncateUrl(url: string, maxLen = 50): string {
  if (!url || url.length <= maxLen) return url
  return url.slice(0, maxLen - 3) + '...'
}

function linkLabel(link: ProjectLink): string {
  const name = (link.nazev ?? '').trim()
  if (name) return name
  const url = (link.url ?? '').trim()
  if (url) return truncateUrl(url)
  return 'Odkaz'
}

type ProjectLinksSectionProps = {
  dokladProjektu: string
}

export default function ProjectLinksSection({ dokladProjektu }: ProjectLinksSectionProps) {
  const [links, setLinks] = useState<ProjectLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/projects/${encodeURIComponent(dokladProjektu)}/links`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message = (body?.error as string) || `Odkazy nelze načíst (${res.status})`
        setError(message)
        setLinks([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : (Array.isArray(data?.links) ? data.links : [])
      setLinks(list)
    } catch (e) {
      logger.error('Error fetching project links:', e)
      setError('Odkazy momentálně nelze načíst')
      setLinks([])
    } finally {
      setLoading(false)
    }
  }, [dokladProjektu])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  if (loading) {
    return (
      <div className="py-3 text-sm text-gray-400">
        Načítání…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-700/70 bg-red-900/40 px-4 py-3 text-sm text-red-100">
        <p className="font-medium">Odkazy momentálně nelze načíst</p>
        <p className="mt-1 text-red-100/90">{error}</p>
        <button
          type="button"
          onClick={fetchLinks}
          className="mt-3 px-3 py-1.5 rounded-lg bg-gray-700/80 text-gray-200 hover:bg-gray-600 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Zkusit znovu
        </button>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <p className="py-3 text-sm text-gray-400">
        Žádné odkazy
      </p>
    )
  }

  return (
    <ul className="space-y-3" role="list">
      {links.map((link, index) => {
        const label = linkLabel(link)
        const url = (link.url ?? '').trim() || '#'
        const hasFirma = (link.nazev_firmy ?? link.id_firmy ?? '').trim().length > 0
        const firmaLabel = (link.nazev_firmy ?? link.id_firmy ?? '').trim() || null

        return (
          <li key={`${index}-${url}-${label}`} className="border-b border-gray-700/50 pb-3 last:border-0 last:pb-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={url}
              className="text-gray-100 font-medium hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            >
              {label}
            </a>
            {(link.popis ?? '').trim() ? (
              <p className="mt-0.5 text-sm text-gray-400 line-clamp-2">{link.popis?.trim()}</p>
            ) : null}
            {hasFirma && firmaLabel ? (
              <p className="mt-1 text-xs text-gray-500">Firma: {firmaLabel}</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

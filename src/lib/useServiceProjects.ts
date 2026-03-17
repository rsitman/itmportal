import { useEffect, useMemo, useRef, useState } from 'react'
import type { ServiceProject } from '@/types/project'

type Result = {
  projects: ServiceProject[]
  loading: boolean
  error: string | null
  labelByDoklad: Map<string, string>
}

let cached: { projects: ServiceProject[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

function buildLabel(p: ServiceProject): string {
  const name = (p.nazev ?? '').trim()
  const doklad = (p.doklad_proj ?? '').trim()
  if (name && doklad) return `${name} · ${doklad}`
  return name || doklad || '—'
}

export function useServiceProjects(): Result {
  const [projects, setProjects] = useState<ServiceProject[]>(cached?.projects ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const abortedRef = useRef(false)

  useEffect(() => {
    abortedRef.current = false
    const now = Date.now()
    const isCacheFresh = Boolean(cached && now - cached.fetchedAt < CACHE_TTL_MS)
    if (isCacheFresh) {
      setProjects(cached!.projects)
      setLoading(false)
      setError(null)
      return () => {
        abortedRef.current = true
      }
    }

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/service-projects')
        if (!res.ok) throw new Error(`Nepodařilo se načíst projekty (${res.status})`)
        const data = (await res.json()) as ServiceProject[]
        if (abortedRef.current) return
        cached = { projects: data, fetchedAt: Date.now() }
        setProjects(data)
      } catch (e: any) {
        if (abortedRef.current) return
        setError(e?.message ?? 'Došlo k chybě při načítání projektů')
      } finally {
        if (!abortedRef.current) setLoading(false)
      }
    }

    void run()
    return () => {
      abortedRef.current = true
    }
  }, [])

  const labelByDoklad = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) {
      const doklad = (p.doklad_proj ?? '').trim()
      if (!doklad) continue
      map.set(doklad, buildLabel(p))
    }
    return map
  }, [projects])

  return { projects, loading, error, labelByDoklad }
}


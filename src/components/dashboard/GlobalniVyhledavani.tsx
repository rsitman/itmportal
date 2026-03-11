'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import DashboardSearchResultsPanel, {
  type SearchProject,
  type SearchNewsItem,
} from './DashboardSearchResultsPanel'

const DEBOUNCE_MS = 300

export default function GlobalniVyhledavani() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [projects, setProjects] = useState<SearchProject[]>([])
  const [news, setNews] = useState<SearchNewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce input -> debouncedTerm
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchTerm.trim()) {
      setDebouncedTerm('')
      return
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim())
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // Fetch when debouncedTerm changes
  const fetchResults = useCallback(async (q: string) => {
    if (!q) {
      setProjects([])
      setNews([])
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Chyba vyhledávání')
        setProjects([])
        setNews([])
        return
      }
      setProjects(data.projects ?? [])
      setNews(data.news ?? [])
    } catch (e) {
      setError('Nepodařilo se načíst výsledky')
      setProjects([])
      setNews([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedTerm) {
      fetchResults(debouncedTerm)
      setShowPanel(true)
    } else {
      setProjects([])
      setNews([])
      setError(null)
      setShowPanel(false)
    }
  }, [debouncedTerm, fetchResults])

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchTerm.trim()
    if (term) {
      setShowPanel(false)
      router.push(`/plan_patchovani?q=${encodeURIComponent(term)}`)
    }
  }

  const handleResultClick = (url: string) => {
    setShowPanel(false)
    setSearchTerm('')
    router.push(url)
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <form onSubmit={handleSubmit} className="relative" aria-label="Vyhledávání na portálu">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.trim() && setShowPanel(true)}
            placeholder="Hledat projekt, firmu, JIRA…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
            aria-label="Globální vyhledávání"
            aria-describedby="vyhledavani-popis"
            aria-expanded={showPanel}
            aria-controls="dashboard-search-results-panel"
            aria-autocomplete="list"
          />
        </div>
        <p id="vyhledavani-popis" className="text-xs text-gray-500 mt-1">
          Enter → přehled patchování · klik na výsledek → detail
        </p>
      </form>

      {showPanel && (
        <div id="dashboard-search-results-panel" className="mt-0">
          <DashboardSearchResultsPanel
            query={debouncedTerm}
            projects={projects}
            news={news}
            isLoading={isLoading}
            error={error}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  )
}

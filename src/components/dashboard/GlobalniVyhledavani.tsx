'use client'

import { useId, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import DashboardSearchResultsPanel, {
  type SearchResultItem,
} from './DashboardSearchResultsPanel'

const DEBOUNCE_MS = 300

type Props = {
  className?: string
}

export default function GlobalniVyhledavani({ className }: Props) {
  const router = useRouter()
  const reactId = useId()
  const panelId = `global-search-results-${reactId.replace(/:/g, '')}`
  const descId = `global-search-hint-${reactId.replace(/:/g, '')}`
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
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
      setResults([])
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
        setResults([])
        return
      }
      setResults(data.results ?? [])
    } catch (e) {
      setError('Nepodařilo se načíst výsledky')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedTerm) {
      fetchResults(debouncedTerm)
      setShowPanel(true)
    } else {
      setResults([])
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
      router.push(`/search?q=${encodeURIComponent(term)}`)
    }
  }

  const handleResultClick = (url: string) => {
    setShowPanel(false)
    setSearchTerm('')
    router.push(url)
  }

  return (
    <div
      ref={containerRef}
      className={['relative', className ?? 'flex-1 max-w-xl'].filter(Boolean).join(' ')}
    >
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
            aria-describedby={descId}
            aria-expanded={showPanel}
            aria-controls={panelId}
            aria-autocomplete="list"
          />
        </div>
        <p id={descId} className="text-xs text-gray-500 mt-1">
          Hledat projekty a aktuality
        </p>
      </form>

      {showPanel && (
        <div className="mt-0">
          <DashboardSearchResultsPanel
            query={debouncedTerm}
            results={results}
            isLoading={isLoading}
            error={error}
            onResultClick={handleResultClick}
            variant="dropdown"
            panelId={panelId}
          />
        </div>
      )}
    </div>
  )
}

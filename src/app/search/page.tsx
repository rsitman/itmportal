'use client'

import type { FormEvent } from 'react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardSearchResultsPanel, {
  type SearchResultItem,
} from '@/components/dashboard/DashboardSearchResultsPanel'
import { Search } from 'lucide-react'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = useMemo(() => (searchParams?.get('q') ?? '').toString().trim(), [searchParams])
  const typeParam = useMemo(() => (searchParams?.get('type') ?? '').toString().trim(), [searchParams])

  const [searchTerm, setSearchTerm] = useState(q)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSearchTerm(q)
  }, [q])

  useEffect(() => {
    let isActive = true

    async function run() {
      if (!q) {
        setResults([])
        setError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!res.ok) {
          if (!isActive) return
          setError(data?.error ?? 'Chyba vyhledávání')
          setResults([])
          return
        }

        if (!isActive) return
        setResults(data.results ?? [])
      } catch {
        if (!isActive) return
        setError('Nepodařilo se načíst výsledky')
        setResults([])
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    run()
    return () => {
      isActive = false
    }
  }, [q])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const term = searchTerm.trim()
    if (!term) {
      router.push('/search')
      return
    }
    const qs = new URLSearchParams()
    qs.set('q', term)
    if (typeParam) qs.set('type', typeParam)
    router.push(`/search?${qs.toString()}`)
  }

  const handleResultClick = (url: string) => {
    router.push(url)
  }

  const filteredResults = useMemo(() => {
    if (!typeParam) return results
    return results.filter((r) => r.type === (typeParam as SearchResultItem['type']))
  }, [results, typeParam])

  return (
    <div className="bg-transparent w-full">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Vyhledávání</h1>
          <p className="mt-1 text-sm text-gray-400">
            Projekty, Aktuality, Patchování, Upgrady a Stav DB v jednom seznamu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat projekt, firmu, JIRA nebo aktualitu…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
              aria-label="Vyhledávání"
            />
          </div>
        </form>

        {!q && (
          <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 p-6 text-sm text-gray-400">
            Zadejte dotaz a odešlete.
          </div>
        )}

        <DashboardSearchResultsPanel
          query={q}
          results={filteredResults}
          isLoading={isLoading}
          error={error}
          onResultClick={handleResultClick}
          variant="page"
        />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-transparent w-full">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Vyhledávání</h1>
              <p className="mt-1 text-sm text-gray-400">Načítám vyhledávání…</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}


'use client'

import type { SearchResultItem, SearchResultType } from '@/types/search'

type Props = {
  query: string
  results: SearchResultItem[]
  isLoading: boolean
  error?: string | null
  onResultClick: (url: string) => void
  variant?: 'dropdown' | 'page'
  panelId?: string
}

export default function DashboardSearchResultsPanel({
  query,
  results,
  isLoading,
  error,
  onResultClick,
  variant = 'dropdown',
  panelId,
}: Props) {
  const groupedByType = (() => {
    const order: SearchResultType[] = ['project', 'person', 'news', 'patch', 'upgrade', 'database']
    const map = new Map<SearchResultType, SearchResultItem[]>()
    for (const r of results) {
      const list = map.get(r.type) ?? []
      list.push(r)
      map.set(r.type, list)
    }
    return order
      .filter((t) => (map.get(t)?.length ?? 0) > 0)
      .map((t) => ({ type: t, items: map.get(t) ?? [] }))
  })()

  const hasResults = groupedByType.length > 0
  const isEmpty = !isLoading && !error && query.length > 0 && !hasResults

  const containerClassName =
    variant === 'dropdown'
      ? 'dashboard-search-results absolute left-0 right-0 top-full z-[999] mt-1 rounded-lg border border-gray-600/60 bg-gray-800/95 shadow-xl backdrop-blur-sm'
      : 'dashboard-search-results relative w-full z-0 mt-0 rounded-lg border border-gray-600/60 bg-gray-800/95 shadow-xl backdrop-blur-sm'

  // `.dashboard-search-results` má v CSS max-height kvůli dropdownu; pro stránku
  // to nechceme omezovat (jinak to vypadá jako malý panel).
  const containerStyle = variant === 'page' ? { maxHeight: 'none', overflowY: 'visible' as const } : undefined

  const labelByType: Record<SearchResultType, string> = {
    project: 'Projekty',
    person: 'Osoby',
    news: 'Aktuality',
    patch: 'Patchování',
    upgrade: 'Upgrady',
    database: 'Stav DB',
  }

  return (
    <div
      id={panelId}
      className={containerClassName}
      style={containerStyle}
      role="listbox"
      aria-label="Výsledky vyhledávání"
    >
      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-6">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-green-500"
            aria-hidden
          />
          <span className="text-sm text-gray-400">Hledám…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="px-4 py-4 text-sm text-amber-200/90">
          Nepodařilo se načíst výsledky. Zkuste to prosím znovu.
        </div>
      )}

      {isEmpty && !isLoading && !error && (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-gray-400">
            Nic nenalezeno pro &quot;{query}&quot;
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Zkuste jiný výraz nebo otevřete přehled projektů.
          </p>
        </div>
      )}

      {hasResults && !isLoading && (
        <div className="divide-y divide-gray-700/60">
          {groupedByType.map(({ type, items }) => (
            <section key={type} className="p-2" aria-label={labelByType[type]}>
              <h3 className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {labelByType[type]}
              </h3>
              <ul className="space-y-0.5">
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onResultClick(r.url)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
                      role="option"
                      aria-selected={false}
                    >
                      <span className="font-medium text-white truncate max-w-full">
                        {r.title || '—'}
                      </span>
                      {r.subtitle ? (
                        <span className="text-xs text-gray-400 truncate max-w-full">{r.subtitle}</span>
                      ) : null}
                      {r.snippet ? (
                        <span className="text-xs text-gray-400 line-clamp-2 max-w-full">{r.snippet}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

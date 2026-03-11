'use client'

export type SearchProject = {
  id: string
  name: string
  companyName: string
  dokladProj: string
  jiraKey: string
  url: string
}

export type SearchNewsItem = {
  id: string
  title: string
  snippet: string
  projectName?: string
  url: string
}

type Props = {
  query: string
  projects: SearchProject[]
  news: SearchNewsItem[]
  isLoading: boolean
  error?: string | null
  onResultClick: (url: string) => void
}

export default function DashboardSearchResultsPanel({
  query,
  projects,
  news,
  isLoading,
  error,
  onResultClick,
}: Props) {
  const hasResults = projects.length > 0 || news.length > 0
  const isEmpty = !isLoading && !error && query.length > 0 && !hasResults

  return (
    <div
      className="dashboard-search-results absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-600/60 bg-gray-800/95 shadow-xl backdrop-blur-sm"
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
          {projects.length > 0 && (
            <section className="p-2" aria-label="Projekty">
              <h3 className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Projekty
              </h3>
              <ul className="space-y-0.5">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onResultClick(p.url)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
                      role="option"
                    >
                      <span className="font-medium text-white truncate max-w-full">
                        {p.name || p.dokladProj || '—'}
                      </span>
                      <span className="text-xs text-gray-400 truncate max-w-full">
                        {p.companyName}
                        {p.jiraKey ? ` · ${p.jiraKey}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {news.length > 0 && (
            <section className="p-2" aria-label="Aktuality">
              <h3 className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Aktuality
              </h3>
              <ul className="space-y-0.5">
                {news.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onResultClick(n.url)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
                      role="option"
                    >
                      <span className="font-medium text-white truncate max-w-full">
                        {n.title || '—'}
                      </span>
                      <span className="text-xs text-gray-400 line-clamp-2 max-w-full">
                        {n.snippet}
                        {n.projectName ? ` · ${n.projectName}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

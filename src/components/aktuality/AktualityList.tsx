import Link from 'next/link'
import type { NewsListItem } from '@/lib/news-server'
import { normalizeNewsOblast } from '@/lib/news-oblast'

export default function AktualityList({
  items,
  selectedId,
  queryString,
}: {
  items: NewsListItem[]
  selectedId?: string
  queryString?: string
}) {
  const querySuffix = queryString ? `?${queryString}` : ''

  return (
    <div className="card-professional rounded-lg p-3 md:p-4">
      <div
        className="hidden sm:grid sm:grid-cols-[minmax(6.5rem,8.5rem)_1fr_auto] gap-x-3 px-2 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 border-b border-gray-700/50"
        aria-hidden="true"
      >
        <span>Oblast</span>
        <span>Název</span>
        <span className="w-3" />
      </div>

      <ul className="divide-y divide-gray-700/50 sm:divide-y-0">
        {items.map((p) => {
          const isSelected = selectedId && p.id === selectedId
          const oblast = normalizeNewsOblast(p.oblast)

          return (
            <li key={p.id} className="sm:border-b sm:border-gray-700/50 last:border-b-0">
              <Link
                href={`/aktuality/${encodeURIComponent(p.id)}${querySuffix}`}
                className={`block rounded-md px-2 py-3 sm:py-2.5 -mx-2 transition-colors ${
                  isSelected ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(6.5rem,8.5rem)_1fr_auto] gap-x-3 gap-y-1 sm:gap-y-0 sm:items-start">
                  <span className="text-xs text-gray-400 sm:pt-0.5">{oblast}</span>
                  <p className="font-medium text-white leading-snug line-clamp-3 sm:line-clamp-2 min-w-0">
                    {p.nadpis}
                  </p>
                  <span className="hidden sm:inline text-xs text-gray-500 shrink-0 mt-0.5">›</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

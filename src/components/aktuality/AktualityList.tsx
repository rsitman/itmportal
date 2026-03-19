import Link from 'next/link'
import type { NewsListItem } from '@/lib/news-server'

function formatDateShort(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AktualityList({
  items,
  selectedId,
}: {
  items: NewsListItem[]
  selectedId?: string
}) {
  return (
    <div className="card-professional rounded-lg p-3 md:p-4">
      <ul className="divide-y divide-gray-700/50">
        {items.map((p) => {
          const isSelected = selectedId && p.id === selectedId
          const hasProjekt = (p.projekt_nazev ?? '').trim() !== ''
          return (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/aktuality/${encodeURIComponent(p.id)}`}
                className={`block rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                  isSelected ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white leading-snug line-clamp-2">{p.nadpis}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs text-gray-400">{formatDateShort(p.datum)}</span>
                      {hasProjekt ? (
                        <span className="text-xs text-gray-400">
                          <span className="text-gray-600">•</span> {p.projekt_nazev}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 mt-0.5">›</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}


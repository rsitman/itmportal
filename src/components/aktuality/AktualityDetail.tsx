import type { PolozkaAktualita } from '@/types/dashboard'
import NewsHtml from '@/components/news/NewsHtml'
import { sanitizeNewsHtml } from '@/lib/news-html'

function formatDateShort(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AktualityDetail({ item }: { item: PolozkaAktualita }) {
  const hasProjekt = (item.projekt_nazev ?? '').trim() !== ''
  const safeHtml = item.obsah ? sanitizeNewsHtml(item.obsah) : ''

  return (
    <div className="card-professional rounded-lg p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white leading-snug">{item.nadpis}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
          <span>{formatDateShort(item.datum)}</span>
          {hasProjekt ? <span className="text-gray-600">•</span> : null}
          {hasProjekt ? <span>{item.projekt_nazev}</span> : null}
        </div>
      </header>

      {safeHtml ? <NewsHtml sanitizedHtml={safeHtml} /> : <p className="text-sm text-gray-400">Bez obsahu.</p>}
    </div>
  )
}


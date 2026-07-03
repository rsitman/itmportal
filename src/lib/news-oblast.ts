import type { NewsListItem } from '@/lib/news-server'

export function normalizeNewsOblast(raw?: string): string {
  const trimmed = (raw ?? '').trim()
  return trimmed || 'Bez oblasti'
}

export function collectNewsOblastOptions(items: NewsListItem[]): string[] {
  return [...new Set(items.map((item) => normalizeNewsOblast(item.oblast)))].sort((a, b) =>
    a.localeCompare(b, 'cs'),
  )
}

export function filterNewsByOblast(items: NewsListItem[], selectedOblasti: string[]): NewsListItem[] {
  if (selectedOblasti.length === 0) return items
  const selected = new Set(selectedOblasti)
  return items.filter((item) => selected.has(normalizeNewsOblast(item.oblast)))
}

export function parseOblastSearchParams(
  searchParams: { getAll: (name: string) => string[] } | null | undefined,
): string[] {
  if (!searchParams) return []
  return [
    ...new Set(
      searchParams
        .getAll('oblast')
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]
}

export function countNewsByOblast(items: NewsListItem[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = normalizeNewsOblast(item.oblast)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

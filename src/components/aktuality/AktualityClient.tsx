'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { NewsListItem } from '@/lib/news-server'
import {
  collectNewsOblastOptions,
  countNewsByOblast,
  filterNewsByOblast,
  parseOblastSearchParams,
} from '@/lib/news-oblast'
import AktualityList from '@/components/aktuality/AktualityList'
import AktualityOblastFilter from '@/components/aktuality/AktualityOblastFilter'

type Props = {
  items: NewsListItem[]
  selectedId?: string
}

export default function AktualityClient({ items, selectedId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedOblasti = useMemo(() => parseOblastSearchParams(searchParams), [searchParams])
  const oblastOptions = useMemo(() => collectNewsOblastOptions(items), [items])
  const oblastCounts = useMemo(() => countNewsByOblast(items), [items])
  const filteredItems = useMemo(
    () => filterNewsByOblast(items, selectedOblasti),
    [items, selectedOblasti],
  )

  const queryString = searchParams?.toString() ?? ''

  const applyOblastFilter = useCallback(
    (nextSelected: string[]) => {
      const base = new URLSearchParams(searchParams?.toString() ?? '')
      base.delete('oblast')
      for (const oblast of nextSelected) base.append('oblast', oblast)
      const qs = base.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const onToggleOblast = useCallback(
    (oblast: string) => {
      const next = selectedOblasti.includes(oblast)
        ? selectedOblasti.filter((value) => value !== oblast)
        : [...selectedOblasti, oblast]
      applyOblastFilter(next)
    },
    [applyOblastFilter, selectedOblasti],
  )

  const onClearOblast = useCallback(() => {
    applyOblastFilter([])
  }, [applyOblastFilter])

  const showFilter = oblastOptions.length > 1

  return (
    <div className="space-y-4">
      {showFilter ? (
        <AktualityOblastFilter
          options={oblastOptions}
          selected={selectedOblasti}
          counts={oblastCounts}
          onToggle={onToggleOblast}
          onClear={onClearOblast}
        />
      ) : null}

      {filteredItems.length > 0 ? (
        <AktualityList items={filteredItems} selectedId={selectedId} queryString={queryString} />
      ) : (
        <div className="card-professional rounded-lg p-4 text-sm text-gray-400">
          {selectedOblasti.length > 0 ? 'Žádné aktuality pro vybrané oblasti.' : 'Žádné aktuality.'}
        </div>
      )}
    </div>
  )
}

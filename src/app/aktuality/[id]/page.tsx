import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getNewsDetail, getNewsList, type NewsListItem } from '@/lib/news-server'
import AktualityClient from '@/components/aktuality/AktualityClient'
import AktualityDetail from '@/components/aktuality/AktualityDetail'
import { logger } from '@/lib/logger'
import type { PolozkaAktualita } from '@/types/dashboard'

function AktualityListFallback() {
  return <div className="card-professional rounded-lg p-4 text-sm text-gray-400">Načítání…</div>
}

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function buildBackHref(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams()
  const oblast = searchParams.oblast
  if (Array.isArray(oblast)) {
    for (const value of oblast) {
      for (const part of value.split(',')) {
        const trimmed = part.trim()
        if (trimmed) params.append('oblast', trimmed)
      }
    }
  } else if (typeof oblast === 'string') {
    for (const part of oblast.split(',')) {
      const trimmed = part.trim()
      if (trimmed) params.append('oblast', trimmed)
    }
  }
  const qs = params.toString()
  return qs ? `/aktuality?${qs}` : '/aktuality'
}

export default async function AktualitaDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const backHref = buildBackHref(resolvedSearchParams)

  const [itemsResult, detailResult] = await Promise.allSettled([getNewsList(), getNewsDetail({ id })])

  let items: NewsListItem[] = []
  let listErrorMessage: string | null = null
  let detailErrorMessage: string | null = null
  let detail: PolozkaAktualita | null = null

  if (itemsResult.status === 'fulfilled') {
    items = itemsResult.value
  } else {
    logger.error('[AKTUALITA_DETAIL_PAGE] Failed to load list', itemsResult.reason)
    listErrorMessage = 'Nepodařilo se načíst seznam aktualit.'
  }

  if (detailResult.status === 'fulfilled') {
    detail = detailResult.value
  } else {
    logger.error('[AKTUALITA_DETAIL_PAGE] Failed to load detail', detailResult.reason)
    detailErrorMessage = 'Aktualitu momentálně nelze načíst. Zkuste to prosím později.'
  }

  // Detail chybu bereme jako outage scénář (hláška + návrat na seznam), notFound necháváme
  // jen pro validní případy "id existuje/začíná, ale položka nebyla nalezena".
  if (!detail && !detailErrorMessage) {
    notFound()
  }

  if (!detail && detailErrorMessage) {
    return (
      <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
        <div className="space-y-6">
          <div className="lg:hidden">
            <Link href={backHref} className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
              ← Zpět na seznam
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-6">
              {listErrorMessage ? (
                <div className="card-professional rounded-lg p-6 text-sm text-gray-400">{listErrorMessage}</div>
              ) : (
                <div className="card-professional rounded-lg p-6 text-sm text-gray-400">
                  Vyberte aktualitu ze seznamu.
                </div>
              )}
            </div>

            <div className="lg:col-span-6">
              <div className="card-professional rounded-lg p-6 text-sm text-gray-400">
                <div className="font-medium text-white mb-2">Nelze načíst aktualitu</div>
                <div className="mb-4">{detailErrorMessage}</div>
                <Link href={backHref} className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
                  Zpět na seznam aktualit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <div className="lg:hidden">
          <Link href={backHref} className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
            ← Zpět na seznam
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="hidden lg:block lg:col-span-6">
            {listErrorMessage ? (
              <div className="card-professional rounded-lg p-6 text-sm text-gray-400">{listErrorMessage}</div>
            ) : (
              <Suspense fallback={<AktualityListFallback />}>
                <AktualityClient items={items} selectedId={id} />
              </Suspense>
            )}
          </div>

          <div className="lg:col-span-6">
            {detail ? <AktualityDetail item={detail} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsDetail, getNewsList, type NewsListItem } from '@/lib/news-server'
import AktualityList from '@/components/aktuality/AktualityList'
import AktualityDetail from '@/components/aktuality/AktualityDetail'
import { logger } from '@/lib/logger'
import type { PolozkaAktualita } from '@/types/dashboard'

export default async function AktualitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
            <Link href="/aktuality" className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
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
                <Link href="/aktuality" className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
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
          <Link href="/aktuality" className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
            ← Zpět na seznam
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="hidden lg:block lg:col-span-6">
            {listErrorMessage ? (
              <div className="card-professional rounded-lg p-6 text-sm text-gray-400">{listErrorMessage}</div>
            ) : (
              <AktualityList items={items} selectedId={id} />
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


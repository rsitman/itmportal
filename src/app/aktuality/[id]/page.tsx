import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsDetail, getNewsList } from '@/lib/news-server'
import AktualityList from '@/components/aktuality/AktualityList'
import AktualityDetail from '@/components/aktuality/AktualityDetail'

export default async function AktualitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [items, detail] = await Promise.all([
    getNewsList(),
    getNewsDetail({ id }),
  ])

  if (!detail) {
    notFound()
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
            <AktualityList items={items} selectedId={id} />
          </div>

          <div className="lg:col-span-6">
            <AktualityDetail item={detail} />
          </div>
        </div>
      </div>
    </div>
  )
}


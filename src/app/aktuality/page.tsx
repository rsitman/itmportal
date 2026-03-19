import { getNewsList } from '@/lib/news-server'
import AktualityList from '@/components/aktuality/AktualityList'

export const metadata = {
  title: 'Aktuality',
}

export default async function AktualityPage() {
  const items = await getNewsList()

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Aktuality</h1>
          <p className="mt-1 text-sm text-gray-300">Přehled interních aktualit.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            {items.length > 0 ? (
              <AktualityList items={items} />
            ) : (
              <div className="card-professional rounded-lg p-4 text-sm text-gray-400">Žádné aktuality.</div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-6">
            <div className="card-professional rounded-lg p-6 text-sm text-gray-400">
              Vyberte aktualitu ze seznamu.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


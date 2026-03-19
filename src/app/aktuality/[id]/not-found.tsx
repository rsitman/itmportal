import Link from 'next/link'

export default function AktualitaNotFound() {
  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="max-w-3xl mx-auto">
        <div className="card-professional rounded-lg p-6">
          <h1 className="text-xl font-semibold text-white">Aktualita nenalezena</h1>
          <p className="mt-2 text-sm text-gray-400">Odkaz je neplatný nebo byla aktualita odstraněna.</p>
          <div className="mt-4">
            <Link href="/aktuality" className="text-sm !text-gray-200 hover:!text-white underline underline-offset-4">
              Zpět na seznam aktualit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


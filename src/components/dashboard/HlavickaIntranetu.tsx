'use client'

import GlobalniVyhledavani from './GlobalniVyhledavani'

export default function HlavickaIntranetu() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Intranet</h1>
        <p className="text-sm text-gray-400 mt-0.5">Servisní portál – přehled a rozcestník</p>
      </div>
      <GlobalniVyhledavani />
    </div>
  )
}

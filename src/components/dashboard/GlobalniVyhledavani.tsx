'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

/**
 * UI placeholder pro globální vyhledávání.
 * Připraveno na budoucí napojení (onSubmit/onChange); reálný search backend se neimplementuje.
 */
export default function GlobalniVyhledavani() {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder: žádná akce, pouze připraveno na budoucí napojení
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Vyhledat na portálu…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
          aria-label="Globální vyhledávání"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Vyhledávání bude doplněno.</p>
    </form>
  )
}

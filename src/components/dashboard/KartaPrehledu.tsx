'use client'

import Link from 'next/link'
import type { PolozkaMojePrace } from '@/types/dashboard'

interface KartaPrehleduProps {
  polozka: PolozkaMojePrace
}

export default function KartaPrehledu({ polozka }: KartaPrehleduProps) {
  return (
    <Link
      href={polozka.href}
      className="block card-professional p-3 rounded-lg border border-gray-700/60 transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium text-white text-sm">{polozka.nazev}</span>
          {polozka.popis && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{polozka.popis}</p>
          )}
        </div>
        {typeof polozka.pocet === 'number' && (
          <span className="flex-shrink-0 text-sm font-semibold text-gray-300 tabular-nums">
            {polozka.pocet}
          </span>
        )}
      </div>
    </Link>
  )
}

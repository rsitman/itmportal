'use client'

import Link from 'next/link'
import { FileText, BookOpen, FileStack } from 'lucide-react'
import type { PolozkaDokumentyANavody } from '@/types/dashboard'

const kategorieIkona: Record<PolozkaDokumentyANavody['kategorie'], React.ComponentType<{ className?: string }>> = {
  dokument: FileText,
  navod: BookOpen,
  sablona: FileStack,
}

interface DokumentyANavodyProps {
  polozky: PolozkaDokumentyANavody[]
}

export default function DokumentyANavody({ polozky }: DokumentyANavodyProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Dokumenty a návody</h2>
      <div className="card-professional rounded-lg p-4 md:p-5">
        <ul className="space-y-2" role="list">
          {polozky.map((p) => {
            const Icon = kategorieIkona[p.kategorie]
            const isPlaceholder = !p.href || p.href === '#'
            if (isPlaceholder) {
              return (
                <li key={p.id}>
                  <span
                    className="flex items-center gap-2 p-2 rounded-md text-gray-500"
                    role="status"
                    aria-label={`${p.nazev} – Připravujeme`}
                  >
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{p.nazev}</span>
                    <span className="text-xs ml-auto">Připravujeme</span>
                  </span>
                </li>
              )
            }
            return (
              <li key={p.id}>
                <Link
                  href={p.href}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-700/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                >
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-white font-medium">{p.nazev}</span>
                  {p.datum && (
                    <span className="text-xs text-gray-500 ml-auto">{p.datum}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

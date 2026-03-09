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
        <ul className="space-y-2">
          {polozky.map((p) => {
            const Icon = kategorieIkona[p.kategorie]
            return (
              <li key={p.id}>
                <Link
                  href={p.href}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-700/40 transition-colors"
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

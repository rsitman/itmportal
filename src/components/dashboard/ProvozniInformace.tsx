'use client'

import Link from 'next/link'
import { AlertCircle, Megaphone, Newspaper, FileEdit } from 'lucide-react'
import type { PolozkaProvozniInformace } from '@/types/dashboard'

const typIkona: Record<PolozkaProvozniInformace['typ'], React.ComponentType<{ className?: string }>> = {
  odstavky: AlertCircle,
  oznameni: Megaphone,
  novinky: Newspaper,
  zmeny_procesu: FileEdit,
}

const typLabel: Record<PolozkaProvozniInformace['typ'], string> = {
  odstavky: 'Odstavky',
  oznameni: 'Oznámení',
  novinky: 'Novinky v portálu',
  zmeny_procesu: 'Změny procesů',
}

interface ProvozniInformaceProps {
  polozky: PolozkaProvozniInformace[]
}

export default function ProvozniInformace({ polozky }: ProvozniInformaceProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Provozní informace</h2>
      <div className="card-professional rounded-lg p-4 md:p-5">
        <ul className="space-y-4">
          {polozky.map((p) => {
            const Icon = typIkona[p.typ]
            const inner = (
              <>
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {typLabel[p.typ]}
                    </span>
                    <p className="font-medium text-white mt-0.5">{p.nadpis}</p>
                    {p.text && <p className="text-sm text-gray-400 mt-1">{p.text}</p>}
                    {p.datum && (
                      <p className="text-xs text-gray-500 mt-1">{p.datum}</p>
                    )}
                  </div>
                </div>
              </>
            )
            return (
              <li key={p.id} className="border-b border-gray-700/60 last:border-0 last:pb-0 pb-4 last:pb-0">
                {p.href && p.href !== '#' ? (
                  <Link href={p.href} className="block hover:opacity-90 transition-opacity">
                    {inner}
                  </Link>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

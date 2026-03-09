'use client'

import type { PolozkaAplikace } from '@/types/dashboard'
import SekceDashboardu from './SekceDashboardu'
import KartaAplikace from './KartaAplikace'

interface AplikaceASystemyProps {
  polozky: PolozkaAplikace[]
}

export default function AplikaceASystemy({ polozky }: AplikaceASystemyProps) {
  return (
    <SekceDashboardu title="Aplikace a systémy">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {polozky.map((p) => (
          <KartaAplikace key={p.id} polozka={p} />
        ))}
      </div>
    </SekceDashboardu>
  )
}

'use client'

import type { PolozkaMojePrace } from '@/types/dashboard'
import SekceDashboardu from './SekceDashboardu'
import KartaPrehledu from './KartaPrehledu'

interface MojePraceProps {
  polozky: PolozkaMojePrace[]
}

export default function MojePrace({ polozky }: MojePraceProps) {
  return (
    <SekceDashboardu title="Moje práce">
      <div className="space-y-2">
        {polozky.map((p) => (
          <KartaPrehledu key={p.id} polozka={p} />
        ))}
      </div>
    </SekceDashboardu>
  )
}

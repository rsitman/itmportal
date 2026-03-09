'use client'

import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import type { StatusZprava, StatusTyp } from '@/types/dashboard'

const typIkona: Record<StatusTyp, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  outage: AlertCircle,
  success: CheckCircle,
}

const typTridy: Record<StatusTyp, string> = {
  info: 'bg-blue-900/40 border-blue-700/60 text-blue-200',
  warning: 'bg-amber-900/40 border-amber-700/60 text-amber-200',
  outage: 'bg-red-900/40 border-red-700/60 text-red-200',
  success: 'bg-green-900/40 border-green-700/60 text-green-200',
}

interface StatusovyProuzekProps {
  zpravy: StatusZprava[]
}

export default function StatusovyProuzek({ zpravy }: StatusovyProuzekProps) {
  if (zpravy.length === 0) return null

  return (
    <div className="w-full space-y-2">
      {zpravy.map((z) => {
        const Icon = typIkona[z.typ]
        return (
          <div
            key={z.id}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${typTridy[z.typ]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{z.text}</span>
            {z.datum && (
              <span className="text-xs opacity-80 ml-auto flex-shrink-0">{z.datum}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

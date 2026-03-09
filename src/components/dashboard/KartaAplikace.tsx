'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Share2,
  FileText,
  Globe,
  Headphones,
  BookOpen,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { PolozkaAplikace } from '@/types/dashboard'

const ikonaMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderTree,
  Package,
  Share2,
  FileText,
  Globe,
  Headphones,
  BookOpen,
  Users,
}

const badgeLabel: Record<string, string> = {
  externi: 'Externí',
  SSO: 'SSO',
  nove_okno: 'Nové okno',
}

interface KartaAplikaceProps {
  polozka: PolozkaAplikace
}

export default function KartaAplikace({ polozka }: KartaAplikaceProps) {
  const Icon = ikonaMap[polozka.ikona] ?? Package
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-700/80 flex items-center justify-center text-gray-300">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{polozka.nazev}</span>
            {polozka.badge && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-600/80 text-gray-300">
                {badgeLabel[polozka.badge] ?? polozka.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-400 line-clamp-1">{polozka.popis}</p>
        </div>
      </div>
    </>
  )

  const className =
    'block card-professional p-4 hover:shadow-md transition-all rounded-lg border border-gray-700/60'

  if (polozka.external && polozka.href.startsWith('http')) {
    return (
      <a href={polozka.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }
  if (polozka.external && polozka.href === '#') {
    return (
      <span className={`${className} opacity-80 cursor-not-allowed`} title="Odkaz bude doplněn">
        {content}
      </span>
    )
  }
  return (
    <Link href={polozka.href} className={className}>
      {content}
    </Link>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Přehled patchování', href: '/plan_patchovani', icon: '📁' },
  { name: 'Evidence projektů', href: '/evidence-projektu', icon: '🗂️' },
  { name: 'Upgrady', href: '/upgrades', icon: '🚀' },
  { name: 'Aktuální stav databází', href: '/databases', icon: '🗄️' },
  { name: 'Grafy', href: '/grafy/db-size', icon: '📈' },
  { name: 'Mapa poboček', href: '/dashboard/mapa', icon: '🗺️' },
  { name: 'Kalendář', href: '/calendar', icon: '📅' },
  { name: 'Uživatelé', href: '/users', icon: '👥' },
  { name: 'Nastavení', href: '/settings', icon: '⚙️' },
  { name: 'Správa rolí', href: '/settings/roles', icon: '🔐' },
  { name: 'HW/SW Konfigurace', href: '/settings/hwsw', icon: '💻' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-semibold text-gray-900">Firma Portal</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

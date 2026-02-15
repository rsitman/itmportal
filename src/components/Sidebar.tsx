'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  FolderTree,
  Rocket,
  Database,
  BarChart3,
  Map,
  Calendar,
  Users,
  Settings,
  Shield,
  Laptop
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Přehled patchování', href: '/plan_patchovani', icon: FolderOpen },
  { name: 'Evidence projektů', href: '/evidence-projektu', icon: FolderTree },
  { name: 'Upgrady', href: '/upgrades', icon: Rocket },
  { name: 'Aktuální stav databází', href: '/databases', icon: Database },
  { name: 'Grafy', href: '/grafy/db-size', icon: BarChart3 },
  { name: 'Mapa poboček', href: '/dashboard/mapa', icon: Map },
  { name: 'Kalendář', href: '/calendar', icon: Calendar },
  { name: 'Uživatelé', href: '/users', icon: Users },
  { name: 'Nastavení', href: '/settings', icon: Settings },
  { name: 'Správa rolí', href: '/settings/roles', icon: Shield },
  { name: 'HW/SW Konfigurace', href: '/settings/hwsw', icon: Laptop },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Servisní portál</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

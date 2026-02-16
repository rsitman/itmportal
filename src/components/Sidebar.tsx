'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderTree,
  Calendar,
  Settings,
  FolderOpen,
  Rocket,
  Database,
  Map,
  Users,
  Shield,
  Laptop
} from 'lucide-react'
import PermissionGuard from './ui/PermissionGuard'
import CollapsibleSection from './ui/CollapsibleSection'
import { Role, Permission } from '@/lib/permissions'
import { usePermissions } from './ui/ProtectedRoute'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  requiredRoles?: Role[]
  requiredPermissions?: Permission[]
  children?: NavigationItem[]
  isCollapsible?: boolean
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Evidence projektů',
    href: '/evidence-projektu',
    icon: FolderTree,
    isCollapsible: true,
    children: [
      {
        name: 'Přehled patchování',
        href: '/plan_patchovani',
        icon: FolderOpen,
        requiredPermissions: [Permission.PROJECTS_VIEW]
      },
      {
        name: 'Upgrady',
        href: '/upgrades',
        icon: Rocket,
        requiredPermissions: [Permission.PROJECTS_VIEW]
      },
      {
        name: 'Aktuální stav databází',
        href: '/databases',
        icon: Database,
        requiredPermissions: [Permission.PROJECTS_VIEW]
      },
      {
        name: 'Mapa poboček',
        href: '/dashboard/mapa',
        icon: Map,
        requiredPermissions: [Permission.MAP_VIEW]
      }
    ]
  },
  {
    name: 'Kalendář',
    href: '/calendar',
    icon: Calendar
  },
  {
    name: 'Nastavení',
    icon: Settings,
    isCollapsible: true,
    children: [
      {
        name: 'Správa rolí',
        href: '/settings/roles',
        icon: Shield,
        requiredRoles: [Role.ADMIN]
      },
      {
        name: 'Uživatelé',
        href: '/users',
        icon: Users,
        requiredRoles: [Role.ADMIN]
      },
      {
        name: 'HW/SW Konfigurace',
        href: '/settings/hwsw',
        icon: Laptop,
        requiredRoles: [Role.ADMIN]
      }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasAnyPermission } = usePermissions()

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = item.href ? pathname === item.href : false
    const hasActiveChild = item.children?.some(child => child.href === pathname)
    const isSectionActive = isActive || hasActiveChild

    // Pokud má children a je collapsible, vykreslíme jako CollapsibleSection
    if (item.children && item.isCollapsible) {
      return (
        <PermissionGuard
          key={item.name}
          roles={item.requiredRoles}
          permissions={item.requiredPermissions}
        >
          <CollapsibleSection
            title={item.name}
            icon={item.icon}
            defaultOpen={hasActiveChild}
            isActive={isSectionActive}
            href={item.href}
          >
            {item.children.map((child) => {
              const isChildActive = child.href === pathname
              return (
                <PermissionGuard
                  key={child.name}
                  roles={child.requiredRoles}
                  permissions={child.requiredPermissions}
                >
                  <Link
                    href={child.href || '#'}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isChildActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <child.icon className="mr-3 h-4 w-4" />
                    {child.name}
                  </Link>
                </PermissionGuard>
              )
            })}
          </CollapsibleSection>
        </PermissionGuard>
      )
    }

    // Jinak vykreslíme jako běžnou položku
    return (
      <PermissionGuard
        key={item.name}
        roles={item.requiredRoles}
        permissions={item.requiredPermissions}
      >
        <Link
          href={item.href || '#'}
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
      </PermissionGuard>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Servisní portál</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map(renderNavigationItem)}
      </nav>
    </div>
  )
}

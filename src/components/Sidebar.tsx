'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import React from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  Users,
  UserCircle,
  Settings,
  FolderTree,
  FolderOpen,
  Rocket,
  Database,
  Map,
  Calendar,
  Shield
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
    name: 'Projekty',
    icon: Briefcase,
    isCollapsible: true,
    children: [
      { name: 'Evidence projektů', href: '/evidence-projektu', icon: FolderTree, requiredPermissions: [Permission.PROJECTS_VIEW] },
      { name: 'Přehled patchování', href: '/plan_patchovani', icon: FolderOpen, requiredPermissions: [Permission.PROJECTS_VIEW] },
      { name: 'Upgrady', href: '/upgrades', icon: Rocket, requiredPermissions: [Permission.PROJECTS_VIEW] }
    ]
  },
  {
    name: 'Provoz & Stav',
    icon: Activity,
    isCollapsible: true,
    children: [
      { name: 'Aktuální stav databází', href: '/databases', icon: Database, requiredPermissions: [Permission.PROJECTS_VIEW] },
      { name: 'Mapa projektů', href: '/dashboard/mapa', icon: Map, requiredPermissions: [Permission.MAP_VIEW] }
    ]
  },
  {
    name: 'Lidé & Organizace',
    icon: Users,
    isCollapsible: true,
    children: [
      { name: 'Osoby ITMAN', href: '/osoby-itman', icon: UserCircle },
      { name: 'Kalendář', href: '/calendar', icon: Calendar }
    ]
  },
  {
    name: 'Správa & Nastavení',
    icon: Settings,
    isCollapsible: true,
    children: [
      { name: 'Nastavení', href: '/settings', icon: Settings },
      { name: 'Správa rolí', href: '/settings/roles', icon: Shield, requiredRoles: [Role.ADMIN] },
      { name: 'Uživatelé', href: '/users', icon: Users, requiredRoles: [Role.ADMIN] }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasAnyPermission, userRole } = usePermissions()

  const hasPermissionForItem = (item: NavigationItem): boolean => {
    if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
      return false
    }
    if (item.requiredPermissions && !hasAnyPermission(item.requiredPermissions)) {
      return false
    }
    return true
  }

  const getVisibleChildren = (children?: NavigationItem[]): NavigationItem[] => {
    if (!children) return []
    return children.filter(child => hasPermissionForItem(child))
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = item.href ? pathname === item.href : false
    const hasActiveChild = item.children?.some(
      child => child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))
    )
    const isSectionActive = isActive || hasActiveChild
    const visibleChildren = getVisibleChildren(item.children)
    const hasVisibleChildren = visibleChildren.length > 0

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
            hasVisibleChildren={hasVisibleChildren}
          >
            {visibleChildren.map((child) => {
              const isChildActive = Boolean(
                child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))
              )
              return (
                <PermissionGuard
                  key={child.name}
                  roles={child.requiredRoles}
                  permissions={child.requiredPermissions}
                >
                  <Link
                    href={child.href || '#'}
                    className={cn(
                      'nav-item group',
                      isChildActive
                        ? 'active'
                        : ''
                    )}
                  >
                    <child.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-200" />
                    <span className={cn(
                      isChildActive ? 'text-white' : 'text-gray-400'
                    )}>{child.name}</span>
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
            'nav-item group',
            isActive
              ? 'active'
              : ''
          )}
        >
          <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-200" />
          <span className={cn(
            isActive ? 'text-white' : 'text-gray-400'
          )}>{item.name}</span>
        </Link>
      </PermissionGuard>
    )
  }

  return (
    <div className="flex h-full w-72 flex-col shell-overlay">
      <div className="flex h-20 items-center justify-center px-8">
        <div className="flex flex-col justify-center py-4">
          <div className="flex items-center justify-center py-4">
            <img 
              src="https://www.itman.cz/wp-content/uploads/2023/11/ITMAN-Logo.png" 
              alt="ITMAN Logo" 
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navigation.map(renderNavigationItem)}
      </nav>
    </div>
  )
}

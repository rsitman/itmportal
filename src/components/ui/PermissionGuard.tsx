'use client'

import { ReactNode } from 'react'
import { Permission, Role, hasPermission } from '@/lib/permissions'
import { usePermissions } from './ProtectedRoute'

interface PermissionGuardProps {
  children: ReactNode
  permissions?: Permission[]
  roles?: Role[]
  fallback?: ReactNode
  requireAll?: boolean // Výchozí false (stačí jedno oprávnění)
}

export default function PermissionGuard({
  children,
  permissions = [],
  roles = [],
  fallback = null,
  requireAll = false
}: PermissionGuardProps) {
  const { userRole, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Kontrola rolí
  if (roles.length > 0 && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Kontrola oprávnění
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Specifické guard komponenty pro běžné případy
interface ActionButtonProps {
  children: ReactNode
  permission?: Permission
  role?: Role
  fallback?: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function ActionButton({
  children,
  permission,
  role,
  fallback = null,
  onClick,
  className = '',
  disabled = false
}: ActionButtonProps) {
  const { userRole, hasPermission } = usePermissions()

  // Kontrola role
  if (role && userRole !== role) {
    return <>{fallback}</>
  }

  // Kontrola oprávnění
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface TableActionsProps {
  children: ReactNode
  tablePermissions: {
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canExport?: boolean
  }
}

export function TableActions({ children, tablePermissions }: TableActionsProps) {
  return (
    <div className="flex gap-2">
      {tablePermissions.canCreate && children}
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { Permission, Role, hasPermission } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: Permission[]
  requiredRole?: Role
  fallback?: ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback = <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Přístup odepřen</h2>
      <p className="text-gray-600">Nemáte dostatečná oprávnění pro zobrazení této stránky.</p>
    </div>
  </div>,
  redirectTo = '/dashboard?error=access_denied'
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    const userRole = session.user?.role as Role || Role.USER

    // Kontrola role
    if (requiredRole && userRole !== requiredRole) {
      if (redirectTo) {
        router.push(redirectTo)
      }
      return
    }

    // Kontrola oprávnění
    if (requiredPermissions.length > 0) {
      const hasAccess = requiredPermissions.some(permission => 
        hasPermission(userRole, permission)
      )
      
      if (!hasAccess) {
        if (redirectTo) {
          router.push(redirectTo)
        }
        return
      }
    }
  }, [session, status, router, requiredPermissions, requiredRole, redirectTo])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return fallback
  }

  const userRole = session.user?.role as Role || Role.USER

  // Check role
  if (requiredRole && userRole !== requiredRole) {
    return fallback
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.some(permission => 
      hasPermission(userRole, permission)
    )
    
    if (!hasAccess) {
      return fallback
    }
  }

  return <>{children}</>
}

// Hook pro kontrolu oprávnění v komponentách
export function usePermissions() {
  const { data: session } = useSession()
  const userRole = session?.user?.role as Role || Role.USER
  
  return {
    userRole,
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => 
      permissions.some(p => hasPermission(userRole, p)),
    hasAllPermissions: (permissions: Permission[]) => 
      permissions.every(p => hasPermission(userRole, p)),
  }
}

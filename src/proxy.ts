import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Role, Permission, hasPermission } from './lib/permissions'

export default withAuth(
  function proxy(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Pokud uživatel není přihlášen, withAuth už se postará o přesměrování na login
    // Nemusíme to dělat zde znovu
    
    // Null check pro token
    if (!token) {
      return NextResponse.next()
    }
    
    const userRole = token.role as Role || Role.USER

    // Definice chráněných rout a jejich oprávnění
    const protectedRoutes = [
      {
        path: '/dashboard',
        permissions: [Permission.DASHBOARD_VIEW],
      },
      {
        path: '/plan_patchovani',
        permissions: [Permission.PROJECTS_VIEW],
      },
      {
        path: '/evidence-projektu',
        permissions: [Permission.PROJECTS_VIEW],
      },
      {
        path: '/grafy',
        permissions: [Permission.CHARTS_VIEW],
      },
      {
        path: '/dashboard/mapa',
        permissions: [Permission.MAP_VIEW],
      },
      {
        path: '/calendar',
        permissions: [Permission.CALENDAR_VIEW],
      },
      {
        path: '/users',
        permissions: [Permission.USERS_VIEW],
      },
      {
        path: '/settings',
        permissions: [Permission.SETTINGS_VIEW],
      },
      {
        path: '/hwsw-config',
        permissions: [Permission.SETTINGS_VIEW],
      },
    ]

    // Kontrola oprávnění pro danou routu
    for (const route of protectedRoutes) {
      if (pathname.startsWith(route.path)) {
        const hasAccess = route.permissions.some(permission => 
          hasPermission(userRole, permission)
        )
        
        if (!hasAccess) {
          // Přesměrování na dashboard s error hláškou
          const errorUrl = new URL('/dashboard?error=access_denied', req.url)
          return NextResponse.redirect(errorUrl)
        }
        break
      }
    }

    // Přesměrování z root a login na dashboard (pokud je přihlášen)
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Povolit přístup na login a API auth routy bez přihlášení
        if (pathname.startsWith('/api/auth') || pathname === '/login') {
          return true
        }
        
        // Povolit přístup na ERP proxy bez přihlášení (interní API)
        if (pathname.startsWith('/api/erp-proxy')) {
          return true
        }
        
        // Povolit přístup na HW/SW API a stránku bez přihlášení (ERP endpoint zatím neexistuje, mock data)
        if (pathname.startsWith('/api/hwsw') || pathname.startsWith('/settings/hwsw')) {
          return true
        }
        
        // Povolit přístup na HWSW config API bez přihlášení
        if (pathname.startsWith('/api/hwsw-config')) {
          return true
        }
        
        // Vyžadovat přihlášení pro všechny ostatní routy
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

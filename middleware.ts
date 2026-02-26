import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Role, Permission, hasPermission } from './src/lib/permissions'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Pokud není token, withAuth se postará o redirect na login
    if (!token) {
      return NextResponse.next()
    }
    
    const userRole = token.role as Role || Role.USER

    // Přesměrování z root a login na dashboard (pouze pokud JE přihlášen)
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

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
          const errorUrl = new URL('/dashboard?error=access_denied', req.url)
          return NextResponse.redirect(errorUrl)
        }
        break
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Vždy propustit NextAuth OAuth routes (signin, callback, csrf, session atd.)
        if (pathname.startsWith('/api/auth')) return true
        // Vždy propustit login stránku (aby se uživatel mohl přihlásit)
        if (pathname === '/login') return true
        return !!token
      },
    },
    pages: {
      signIn: '/login',
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
     * - public folder (public files)
     * - api/auth/* (NextAuth routes must be accessible)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}

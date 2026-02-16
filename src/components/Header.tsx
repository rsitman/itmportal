'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { logger } from '@/lib/logger'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Získání názvu stránky z pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/calendar':
        return 'Kalendář'
      case '/dashboard':
        return 'Dashboard'
      case '/plan_patchovani':
        return 'Přehled patchování'
      case '/evidence-projektu':
        return 'Evidence projektů'
      case '/upgrades':
        return 'Upgrady'
      case '/databases':
        return 'Aktuální stav databází'
      case '/grafy/db-size':
        return 'Grafy'
      case '/dashboard/mapa':
        return 'Mapa poboček'
      case '/users':
        return 'Uživatelé'
      case '/settings':
        return 'Nastavení'
      case '/settings/roles':
        return 'Správa rolí'
      case '/settings/hwsw':
        return 'HW/SW Konfigurace'
      default:
        return 'Servisní portál'
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    
    try {
      // Získat uživatelské preference pro logování
      const prefsResponse = await fetch('/api/user/preferences')
      const userPrefs = prefsResponse.ok ? await prefsResponse.json() : null
      
      logger.log('User signing out - rememberLogin:', userPrefs?.rememberLogin)
      
      // Získat Azure AD logout URL
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const logoutData = await logoutResponse.json()
      
      // VŽDY úplné odhlášení - bez ohledu na rememberLogin nastavení
      // Explicitní odhlášení = vždy smazat cookies
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      })
      
      // Pokud máme Azure AD logout URL, přesměrovat tam pro úplné odhlášení
      if (logoutData.success && logoutData.logoutUrl) {
        logger.log('Redirecting to Azure AD logout for complete sign out')
        window.location.href = logoutData.logoutUrl
      } else {
        // Jinak jen přesměrovat na login
        router.push('/login')
        router.refresh()
      }
      
    } catch (error) {
      logger.error('Error during sign out:', error)
      // I při chybě se pokusíme přesměrovat
      router.push('/login')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {getPageTitle()}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {session?.user?.name}
            </span>
            <span className="text-xs text-gray-500">
              Administrator
            </span>
          </div>
        </div>
        
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          disabled={isSigningOut}
          className="border-gray-300 hover:bg-gray-50"
        >
          {isSigningOut ? 'Odhlášení...' : 'Odhlásit se'}
        </Button>
      </div>
    </header>
  )
}

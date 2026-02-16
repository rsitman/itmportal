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
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Kalendář</span></>
      case '/dashboard':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Dashboard</span></>
      case '/plan_patchovani':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Přehled patchování</span></>
      case '/evidence-projektu':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Evidence projektů</span></>
      case '/upgrades':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Upgrady</span></>
      case '/databases':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Aktuální stav databází</span></>
      case '/grafy/db-size':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Grafy</span></>
      case '/dashboard/mapa':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Mapa projektů</span></>
      case '/users':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Uživatelé</span></>
      case '/settings':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Nastavení</span></>
      case '/settings/roles':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - Správa rolí</span></>
      case '/settings/hwsw':
        return <><span className="text-green-400">Servisní portál</span><span className="text-white"> - HW/SW Konfigurace</span></>
      default:
        return <span className="text-green-400">Servisní portál</span>
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
    <header className="flex h-20 items-center justify-between border-b border-gray-700/50 bg-gray-900/90 backdrop-blur-md px-8 shadow-lg">
      <div className="flex items-center">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-green-400 tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-gray-700/80 flex items-center justify-center text-gray-300 text-lg font-semibold border border-gray-600/50">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white">
              {session?.user?.name}
            </span>
            <span className="text-sm text-gray-400">
              {session?.user?.role === 'ADMIN' ? 'Administrator' : 'Uživatel'}
            </span>
          </div>
        </div>
        
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          disabled={isSigningOut}
          className="border-gray-600/50 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 backdrop-blur-sm"
        >
          {isSigningOut ? 'Odhlášení...' : 'Odhlásit se'}
        </Button>
      </div>
    </header>
  )
}

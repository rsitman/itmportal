'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  
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
        return 'Firma Portal'
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {getPageTitle()}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {session?.user?.name}
          </span>
        </div>
        
        <Button
          onClick={() => signOut()}
          variant="outline"
          size="sm"
        >
          Odhlásit se
        </Button>
      </div>
    </header>
  )
}

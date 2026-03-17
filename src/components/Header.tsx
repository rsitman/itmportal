'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { RefObject } from 'react'
import { logger } from '@/lib/logger'
import { Menu } from 'lucide-react'

type HeaderProps = {
  onOpenSidebar?: () => void
  sidebarOpen?: boolean
  sidebarControlsId?: string
  menuButtonRef?: RefObject<HTMLButtonElement>
}

export default function Header({
  onOpenSidebar,
  sidebarOpen,
  sidebarControlsId,
  menuButtonRef,
}: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    const isAzureUser = (session as any)?.authProvider === 'AZURE_AD'
    const userEmail = session?.user?.email

    try {
      if (isAzureUser) {
        // Azure AD uživatel — nejprve smazat NextAuth session, pak odhlásit u Microsoftu
        const logoutResponse = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        })
        const logoutData = await logoutResponse.json()

        await signOut({ redirect: false })

        if (logoutData.logoutUrl) {
          logger.log('Redirecting to Azure AD logout:', logoutData.logoutUrl)
          window.location.href = logoutData.logoutUrl
        } else {
          router.push('/login')
        }
      } else {
        // Lokální uživatel — pouze NextAuth signOut, žádný Microsoft redirect
        await signOut({ redirect: false })
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      logger.error('Error during sign out:', error)
      router.push('/login')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="flex h-14 lg:h-20 items-center justify-between shell-overlay px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden inline-flex items-center justify-center rounded-lg border border-gray-600/50 bg-gray-800/70 hover:bg-gray-700/80 text-gray-200 shadow-sm transition-colors h-10 w-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          aria-label="Otevřít navigaci"
          aria-expanded={Boolean(sidebarOpen)}
          aria-controls={sidebarControlsId}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gray-700/80 flex items-center justify-center text-gray-300 text-base lg:text-lg font-semibold border border-gray-600/50">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm lg:text-base font-semibold text-white leading-tight">
              {session?.user?.name}
            </span>
            <span className="text-xs lg:text-sm text-gray-400">
              {session?.user?.role === 'ADMIN' ? 'Administrator' : 'Uživatel'}
            </span>
          </div>
        </div>
        
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          disabled={isSigningOut}
          className="border-gray-600/50 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white shadow-sm hover:shadow-md transition-all duration-200 px-3 lg:px-4 py-2 backdrop-blur-sm"
        >
          {isSigningOut ? 'Odhlášení...' : 'Odhlásit se'}
        </Button>
      </div>
    </header>
  )
}

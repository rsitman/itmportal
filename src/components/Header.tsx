'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { logger } from '@/lib/logger'

export default function Header() {
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

  return (
    <header className="flex h-20 items-center justify-end bg-gray-900/80 backdrop-blur-md px-8">
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

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
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false)

  const impersonation = (session as any)?.impersonation
  const isImpersonating = Boolean(impersonation?.active)
  const originalUser = impersonation?.originalUser
  const targetUser = impersonation?.targetUser

  const handleStopImpersonation = async () => {
    if (isStoppingImpersonation) return
    setIsStoppingImpersonation(true)
    try {
      // Best-effort audit log on server.
      await fetch('/api/impersonation/stop', { method: 'POST' }).catch(() => null)

      const updatedSession = await update({ impersonation: { action: 'stop' } } as any)
      const stillImpersonating = Boolean((updatedSession as any)?.impersonation?.active)

      if (stillImpersonating) {
        // Pragmatic fallback when session propagation is flaky.
        window.location.reload()
        return
      }

      // Ensure session endpoint reflects the new state (avoid redirect/guard race after stop).
      for (let i = 0; i < 5; i++) {
        try {
          const res = await fetch('/api/auth/session', { cache: 'no-store' })
          const s = await res.json().catch(() => null)
          if (!s?.impersonation?.active) break
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 80))
      }

      router.refresh()
    } catch (error) {
      logger.error('Error stopping impersonation:', error)
    } finally {
      setIsStoppingImpersonation(false)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      // Portal-only logout: clear local NextAuth session, do not trigger Microsoft global logout.
      await signOut({ redirect: false })
      router.push('/login')
      router.refresh()
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
            <span suppressHydrationWarning>
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm lg:text-base font-semibold text-white leading-tight" suppressHydrationWarning>
              {session?.user?.name ?? ''}
            </span>
            <span className="text-xs lg:text-sm text-gray-400" suppressHydrationWarning>
              {session?.user?.role ? (session?.user?.role === 'ADMIN' ? 'Administrator' : 'Uživatel') : ''}
            </span>
          </div>
        </div>

        {isImpersonating ? (
          <div className="hidden sm:flex items-center gap-3">
            <div className="rounded-md border border-amber-700/40 bg-amber-900/20 px-3 py-1.5 text-xs text-amber-100/90">
              <span className="font-medium">Impersonizace:</span>{' '}
              <span className="font-mono">
                {targetUser?.email || targetUser?.name || '—'}
              </span>
              {originalUser?.email ? (
                <span className="text-amber-200/60"> (admin: {originalUser.email})</span>
              ) : null}
            </div>
            <Button
              onClick={handleStopImpersonation}
              variant="outline"
              size="sm"
              disabled={isStoppingImpersonation}
              className="border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30 text-amber-100/90 hover:text-amber-50 shadow-sm transition-colors px-3 py-2"
            >
              {isStoppingImpersonation ? 'Vracím…' : 'Zpět na admin účet'}
            </Button>
          </div>
        ) : null}
        
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

'use client'

import { NextAuthProvider } from "@/lib/nextauth-client"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarControlsId = useMemo(() => 'app-mobile-sidebar-drawer', [])

  const isProjectsPage =
    pathname === '/plan_patchovani' ||
    pathname === '/upgrades' ||
    pathname === '/databases' ||
    pathname.startsWith('/aktuality') ||
    pathname === '/dashboard/mapa' ||
    pathname === '/osoby-itman' ||
    pathname === '/calendar' ||
    pathname === '/evidence-projektu' ||
    pathname === '/hwsw-config' ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/plan_patchovani/') ||
    pathname.startsWith('/patch-modules') ||
    pathname.startsWith('/projects/doklad-projektu')

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    if (isLoginPage) return
    setSidebarOpen(false)
  }, [isLoginPage, pathname])

  // Mobile drawer: scroll lock + Escape close + minimal focus management.
  useEffect(() => {
    if (isLoginPage) return
    if (!sidebarOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }

    window.addEventListener('keydown', onKeyDown)

    // Focus close button when opening.
    window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      // Return focus to the menu button after closing.
      menuButtonRef.current?.focus()
    }
  }, [closeSidebar, isLoginPage, sidebarOpen])

  return (
    <AuthErrorBoundary>
      <NextAuthProvider>
        {isLoginPage ? (
          <>{children}</>
        ) : (
        <div className="flex h-screen app-shell-bg">
          {/* Mobile overlay (only <lg) */}
          <div
            className={[
              'fixed inset-0 z-40 bg-black/55 transition-opacity lg:hidden',
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            ].join(' ')}
            aria-hidden={!sidebarOpen}
          >
            <button
              type="button"
              className="absolute inset-0"
              onClick={closeSidebar}
              aria-label="Zavřít navigaci"
              tabIndex={sidebarOpen ? 0 : -1}
            />
          </div>

          {/* Single sidebar DOM: desktop static, mobile off-canvas */}
          <div
            id={sidebarControlsId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigace"
            className={[
              'fixed inset-y-0 left-0 z-50 w-72 max-w-[88vw] shadow-strong transition-transform duration-200 lg:static lg:inset-auto lg:z-auto lg:max-w-none lg:shadow-none lg:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            ].join(' ')}
          >
            <div className="relative h-full">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeSidebar}
                className="lg:hidden absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-lg border border-gray-600/50 bg-gray-800/70 hover:bg-gray-700/80 text-gray-200 shadow-sm transition-colors h-10 w-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Zavřít navigaci"
                tabIndex={sidebarOpen ? 0 : -1}
              >
                <span aria-hidden>×</span>
              </button>
              <Sidebar onNavigate={closeSidebar} />
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header
              onOpenSidebar={openSidebar}
              sidebarOpen={sidebarOpen}
              sidebarControlsId={sidebarControlsId}
              menuButtonRef={menuButtonRef}
            />
            <main className={`flex-1 overflow-y-auto ${isProjectsPage ? '' : 'p-8'}`}>
              <div className={`${isProjectsPage ? '' : 'max-w-7xl mx-auto w-full'} bg-transparent`}>
                {children}
              </div>
            </main>
          </div>
        </div>
        )}
      </NextAuthProvider>
    </AuthErrorBoundary>
  )
}

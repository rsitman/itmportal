'use client'

import { NextAuthProvider } from "@/lib/nextauth-client"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarControlsId = useMemo(() => 'app-mobile-sidebar-drawer', [])

  if (isLoginPage) {
    return (
      <AuthErrorBoundary>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </AuthErrorBoundary>
    );
  }

  const isProjectsPage =
    pathname === '/plan_patchovani' ||
    pathname === '/upgrades' ||
    pathname === '/databases' ||
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
    pathname.startsWith('/projects/doklad-projektu');

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Mobile drawer: scroll lock + Escape close + minimal focus management.
  useEffect(() => {
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
  }, [closeSidebar, sidebarOpen])

  return (
    <AuthErrorBoundary>
      <NextAuthProvider>
        <div className="flex h-screen app-shell-bg">
          {/* Desktop sidebar (permanent) */}
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          {/* Mobile sidebar (off-canvas drawer) */}
          <div
            className={[
              'lg:hidden fixed inset-0 z-50',
              sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
            ].join(' ')}
            aria-hidden={!sidebarOpen}
          >
            <button
              type="button"
              className={[
                'absolute inset-0 bg-black/55 transition-opacity',
                sidebarOpen ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              onClick={closeSidebar}
              aria-label="Zavřít navigaci"
              tabIndex={sidebarOpen ? 0 : -1}
            />
            <div
              id={sidebarControlsId}
              role={sidebarOpen ? 'dialog' : undefined}
              aria-modal={sidebarOpen ? 'true' : undefined}
              aria-label="Navigace"
              className={[
                'absolute inset-y-0 left-0 w-72 max-w-[88vw] shadow-strong transition-transform duration-200',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
            >
              <div className="relative h-full">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeSidebar}
                  className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-lg border border-gray-600/50 bg-gray-800/70 hover:bg-gray-700/80 text-gray-200 shadow-sm transition-colors h-10 w-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  aria-label="Zavřít navigaci"
                  tabIndex={sidebarOpen ? 0 : -1}
                >
                  <span aria-hidden>×</span>
                </button>
                <Sidebar onNavigate={closeSidebar} />
              </div>
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
      </NextAuthProvider>
    </AuthErrorBoundary>
  );
}

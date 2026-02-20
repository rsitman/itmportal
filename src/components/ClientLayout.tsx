'use client'

import { NextAuthProvider } from "@/lib/nextauth-client"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/plan_patchovani' || pathname === '/upgrades' || pathname === '/databases' || pathname === '/dashboard/mapa' || pathname === '/calendar' || pathname === '/evidence-projektu' || pathname.startsWith('/settings') || pathname.startsWith('/dashboard') || pathname.startsWith('/users');
  
  return (
    <AuthErrorBoundary>
      <NextAuthProvider>
        <div className="flex h-screen" style={{
          background: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="50%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="%233b82f6" opacity="0.1"/></pattern></defs><rect width="1920" height="1080" fill="url(%23grad)"/><rect width="1920" height="1080" fill="url(%23pattern)"/></svg>\') center/cover',
          backgroundAttachment: 'fixed'
        }}>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
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

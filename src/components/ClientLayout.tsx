'use client'

import { NextAuthProvider } from "@/lib/nextauth-client"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
  
  return (
    <AuthErrorBoundary>
      <NextAuthProvider>
        <div className="flex h-screen app-shell-bg">
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

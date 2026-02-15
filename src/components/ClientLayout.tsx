'use client'

import { NextAuthProvider } from "@/lib/nextauth-client"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/plan_patchovani';
  
  return (
    <AuthErrorBoundary>
      <NextAuthProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className={`flex-1 overflow-y-auto ${isProjectsPage ? '' : 'p-6'}`}>
              {children}
            </main>
          </div>
        </div>
      </NextAuthProvider>
    </AuthErrorBoundary>
  );
}

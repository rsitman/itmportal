'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/lib/nextauth-client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectsPage = pathname === '/plan_patchovani';
  
  return (
    <html lang="cs">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
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
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
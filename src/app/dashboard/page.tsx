'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { logger } from '@/lib/logger'
import HlavickaIntranetu from '@/components/dashboard/HlavickaIntranetu'
import StatusovyProuzek from '@/components/dashboard/StatusovyProuzek'
import AplikaceASystemy from '@/components/dashboard/AplikaceASystemy'
import MojePrace from '@/components/dashboard/MojePrace'
import ProvozniInformace from '@/components/dashboard/ProvozniInformace'
import DokumentyANavody from '@/components/dashboard/DokumentyANavody'
import Aktuality from '@/components/dashboard/Aktuality'
import {
  mockStatusZpravy,
  mockAplikace,
  mockMojePrace,
  mockProvozniInformace,
  mockDokumentyANavody,
} from '@/data/dashboard-mock'

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error === 'access_denied') {
      logger.warn('Přístup odepřen - nedostatečná oprávnění')
    }
    if (error === 'azure_ad_users_restricted') {
      logger.warn('Azure AD uživatelé nemohou přistupovat na správu uživatelů')
    }
  }, [error])

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        {/* Chybové hlášky z query parametrů */}
        {error === 'access_denied' && (
          <div className="bg-red-900/50 border border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">Přístup odepřen</h3>
                <p className="mt-1 text-sm text-red-300">
                  Nemáte dostatečná oprávnění pro zobrazení požadované stránky. Kontaktujte administrátora.
                </p>
              </div>
            </div>
          </div>
        )}

        {error === 'azure_ad_users_restricted' && (
          <div className="bg-yellow-900/50 border border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-200">Omezení přístupu</h3>
                <p className="mt-1 text-sm text-yellow-300">
                  Uživatelé přihlášení přes Azure AD nemohou přistupovat na správu uživatelů. Pro správu uživatelů se přihlaste pomocí lokálního administrátorského účtu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Řádek 1: Hlavička + vyhledávání */}
        <HlavickaIntranetu />

        {/* Řádek 2: Statusový proužek */}
        <StatusovyProuzek zpravy={mockStatusZpravy} />

        {/* Řádek 3: Aplikace a systémy (8) | Moje práce (4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <AplikaceASystemy polozky={mockAplikace} />
          </div>
          <div className="lg:col-span-4">
            <MojePrace polozky={mockMojePrace} />
          </div>
        </div>

        {/* Řádek 4: Aktuality + Provozní informace (8) | Dokumenty a návody (4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Aktuality />
            <ProvozniInformace polozky={mockProvozniInformace} />
          </div>
          <div className="lg:col-span-4">
            <DokumentyANavody polozky={mockDokumentyANavody} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh] text-gray-400">Načítání…</div>}>
      <DashboardContent />
    </Suspense>
  )
}

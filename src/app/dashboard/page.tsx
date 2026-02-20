'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { logger } from '@/lib/logger'

interface DashboardStats {
  projects: number
  users: number
  events: number
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, users: 0, events: 0 })

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

  // Fetch real stats
  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchStats = async () => {
      const [projectsRes, usersRes, eventsRes] = await Promise.allSettled([
        fetch('/api/karat/projects'),
        fetch('/api/users'),
        fetch('/api/events'),
      ])

      setStats({
        projects: projectsRes.status === 'fulfilled' && projectsRes.value.ok
          ? (await projectsRes.value.json()).length ?? 0
          : 0,
        users: usersRes.status === 'fulfilled' && usersRes.value.ok
          ? (await usersRes.value.json()).length ?? 0
          : 0,
        events: eventsRes.status === 'fulfilled' && eventsRes.value.ok
          ? (await eventsRes.value.json()).length ?? 0
          : 0,
      })
    }

    fetchStats()
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error message */}
        {error === 'access_denied' && (
          <div className="mb-6 bg-red-900/50 border border-red-800 rounded-md p-4">
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
          <div className="mb-6 bg-yellow-900/50 border border-yellow-800 rounded-md p-4">
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

        {/* Welcome Header */}
        <div className="card-professional p-6 mb-6">
          <h1 className="text-2xl font-bold text-white">
            Vítejte zpět, {session.user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-300">
            Přihlášen jako: {session.user?.email} | Role: {session.user?.role}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-professional">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Projekty</dt>
                    <dd className="text-lg font-medium text-white">{stats.projects}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
              <div className="text-sm">
                <a href="/plan_patchovani" className="font-medium text-green-400 hover:text-green-300">
                  Zobrazit všechny projekty →
                </a>
              </div>
            </div>
          </div>

          <div className="card-professional">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Uživatelé</dt>
                    <dd className="text-lg font-medium text-white">{stats.users}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
              <div className="text-sm">
                <a href="/users" className="font-medium text-blue-400 hover:text-blue-300">
                  Spravovat uživatele →
                </a>
              </div>
            </div>
          </div>

          <div className="card-professional">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Grafy</dt>
                    <dd className="text-lg font-medium text-white">6</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
              <div className="text-sm">
                <a href="/grafy/db-size" className="font-medium text-green-400 hover:text-green-300">
                  Zobrazit grafy →
                </a>
              </div>
            </div>
          </div>

          <div className="card-professional">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Kalendář</dt>
                    <dd className="text-lg font-medium text-white">{stats.events}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
              <div className="text-sm">
                <a href="/calendar" className="font-medium text-green-400 hover:text-green-300">
                  Zobrazit kalendář →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-white mb-4">Rychlé akce</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/plan_patchovani"
              className="card-professional p-6 block hover:shadow-md transition-all"
            >
              <h3 className="text-base font-medium text-white">Nový projekt</h3>
              <p className="mt-1 text-sm text-gray-400">Vytvořit nový projekt</p>
            </a>
            
            <a
              href="/dashboard/mapa"
              className="card-professional p-6 block hover:shadow-md transition-all"
            >
              <h3 className="text-base font-medium text-white">Mapa projektů</h3>
              <p className="mt-1 text-sm text-gray-400">Zobrazit mapu</p>
            </a>
            
            <a
              href="/grafy/db-size"
              className="card-professional p-6 block hover:shadow-md transition-all"
            >
              <h3 className="text-base font-medium text-white">Reporty</h3>
              <p className="mt-1 text-sm text-gray-400">Zobrazit reporty a grafy</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

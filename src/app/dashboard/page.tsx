'use client'

import { useSession } from 'next-auth/react'  // ← JEDINÝ import!
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { logger } from '@/lib/logger'

interface DashboardStats {
  projects: number
  users: number
  events: number
}

function DashboardContent() {
  const { data: session, status } = useSession()  // ← JEDINÝ useSession!
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

  // Fetch real stats S TOKENEM
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) {
      console.log('No session/token, skipping stats')
      return
    }

    const fetchStats = async () => {
      console.log('Fetching stats with token:', session.accessToken?.slice(0, 20) + '...')  // DEBUG
      
      const [projectsRes, usersRes, eventsRes] = await Promise.allSettled([
        fetch('/api/karat/projects', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,  // ✅ TOKEN!
          },
        }),
        fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }),
        fetch('/api/events', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }),
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
  }, [status, session?.accessToken])  // ← ZÁVISLOST!

  // Zbytek kódu NECH (stats cards, quick actions)...

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
        {/* Error messages */}
        {error === 'access_denied' && (
          <div className="card-professional p-6 mb-6 border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Přístup odepřen</h3>
                <div className="mt-2 text-sm text-red-400">
                  <p>Nemáte dostatečná oprávnění pro přístup k této stránce.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error === 'azure_ad_users_restricted' && (
          <div className="card-professional p-6 mb-6 border-l-4 border-yellow-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-300">Omezený přístup</h3>
                <div className="mt-2 text-sm text-yellow-400">
                  <p>Uživatelé přihlášení přes Azure AD nemohou přistupovat ke správě uživatelů.</p>
                </div>
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
            Přehled vašeho IT portálu - {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-300 truncate">Projekty</dt>
                  <dd className="text-lg font-semibold text-white">{stats.projects}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-300 truncate">Uživatelé</dt>
                  <dd className="text-lg font-semibold text-white">{stats.users}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-300 truncate">Události</dt>
                  <dd className="text-lg font-semibold text-white">{stats.events}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-300 truncate">Systém</dt>
                  <dd className="text-lg font-semibold text-white">Online</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-white mb-4">Rychlé akce</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push('/projects')}
              className="card-professional p-4 text-left hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <h3 className="text-white font-medium">Evidence projektů</h3>
                  <p className="text-sm text-gray-400">Správa projektů a týmů</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/users')}
              className="card-professional p-4 text-left hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div>
                  <h3 className="text-white font-medium">Správa uživatelů</h3>
                  <p className="text-sm text-gray-400">Uživatelské účty a role</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/calendar')}
              className="card-professional p-4 text-left hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="text-white font-medium">Kalendář</h3>
                  <p className="text-sm text-gray-400">Plánování událostí</p>
                </div>
              </div>
            </button>
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

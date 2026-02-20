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

  // TVŮJ JSX RETURN (stats cards)...
  return (
    // ← VLOŽ SVŮJ PŘEDCHOZÍ RETURN
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

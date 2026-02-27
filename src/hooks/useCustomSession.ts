'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface CustomSession {
  user: User
  loginTime: string
}

export function useCustomSession() {
  const [session, setSession] = useState<CustomSession | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    // Zkontrolovat session cookie
    const checkSession = () => {
      try {
        // Načíst cookie (pro klienta musíme použít document.cookie)
        const cookies = document.cookie.split(';')
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('user-session='))
        
        if (sessionCookie) {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]))
          setSession(sessionData)
          setStatus('authenticated')
        } else {
          setSession(null)
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setSession(null)
        setStatus('unauthenticated')
      }
    }

    checkSession()
    
    // Přidat listener pro změny cookies
    const interval = setInterval(checkSession, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return { data: session, status }
}

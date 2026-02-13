'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function useSessionSafe() {
  const { data: session, status, error } = useSession()
  
  useEffect(() => {
    // Suppress CLIENT_FETCH_ERROR as it's expected behavior when not authenticated
    if (error?.message?.includes('CLIENT_FETCH_ERROR')) {
      console.warn('CLIENT_FETCH_ERROR is normal when not authenticated')
      return
    }
    
    // Log other errors
    if (error && !error.message?.includes('CLIENT_FETCH_ERROR')) {
      console.error('Session error:', error)
    }
  }, [error])
  
  return { session, status, error }
}

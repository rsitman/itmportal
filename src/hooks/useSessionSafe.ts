'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function useSessionSafe() {
  const { data: session, status } = useSession()
  
  useEffect(() => {
    // Session handling is now managed by next-auth internally
  }, [])
  
  return { session, status }
}

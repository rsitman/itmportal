'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'

interface NextAuthProviderProps {
  children: ReactNode
}

export function NextAuthProvider(props: NextAuthProviderProps) {
  const { children } = props
  
  useEffect(() => {
    const originalError = console.error
    console.error = (...args: any[]) => {
      const message = args[0]
      
      if (typeof message === 'string' && message.includes('CLIENT_FETCH_ERROR')) {
        return
      }
      
      // Filter out KARAT 404 errors that are expected in some cases
      if (typeof message === 'string' && message.includes('KARAT direct fetch error: 404')) {
        return
      }
      
      // Filter out fetch errors for ERP endpoints that might be temporarily unavailable
      if (typeof message === 'object' && message?.message?.includes('fetch failed')) {
        return
      }
      
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return SessionProvider({ children })
}

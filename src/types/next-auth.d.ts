import 'next-auth'
import { UserRole, AuthProvider } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: UserRole
    }
    accessToken?: string
    authProvider?: AuthProvider
  }

  interface User {
    role?: UserRole
    authProvider?: AuthProvider
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    id?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    authProvider?: AuthProvider
    rememberLogin?: boolean
    sessionPreference?: 'REMEMBER' | 'TEMPORARY'
    maxAge?: number
  }
}

declare module 'next-auth' {
  interface Profile {
    oid?: string
    sub?: string
    email?: string
    preferred_username?: string
  }
}

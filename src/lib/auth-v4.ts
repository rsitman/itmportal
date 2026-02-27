import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  
  pages: {
    signIn: '/login',
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Debug: Vždy vrátíme testovacího uživatele
        if (credentials?.email === 'admin' && credentials?.password === 'admin') {
          return {
            id: '1',
            email: 'admin',
            name: 'Admin User',
            role: 'ADMIN'
          }
        }
        return null
      }
    })
  ]
}

// Helper functions for compatibility
export async function getSession() {
  try {
    const { getServerSession } = await import('next-auth')
    return await getServerSession(authOptions)
  } catch (error) {
    return null
  }
}

export function getAccessToken(session: any): string | null {
  if (session?.accessToken) {
    return session.accessToken as string
  }
  return null
}

export function hasRole(session: any, role: string): boolean {
  return session?.user?.role === role
}

export function isAdmin(session: any): boolean {
  return hasRole(session, 'ADMIN')
}

export function isIT(session: any): boolean {
  return hasRole(session, 'IT') || isAdmin(session)
}

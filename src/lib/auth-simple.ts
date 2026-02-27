import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: '/login',
  },
  
  debug: true, // Vždy zapnout debug
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('=== SIMPLE AUTH AUTHORIZE ===')
        console.log('Email:', credentials?.email)
        console.log('Password:', credentials?.password)
        
        if (credentials?.email === 'admin' && credentials?.password === 'admin') {
          console.log('✅ AUTH SUCCESS')
          return {
            id: '1',
            email: 'admin',
            name: 'Admin User',
            role: 'ADMIN'
          }
        }
        
        console.log('❌ AUTH FAILED')
        return null
      }
    })
  ]
}

// Helper functions
export async function getSession() {
  try {
    const { getServerSession } = await import('next-auth')
    return await getServerSession(authOptions)
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

export function getAccessToken(session: any): string | null {
  return session?.accessToken || null
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

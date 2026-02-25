import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { azureADProviderConfig } from './entra-id'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole, AuthProvider } from '@prisma/client'
import { customLogger } from './nextauth-logger'
import { logger } from './logger'

// Globální override pro console.error aby se potlačil CLIENT_FETCH_ERROR
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  const message = args[0]
  if (typeof message === 'string' && message.includes('CLIENT_FETCH_ERROR')) {
    return
  }
  if (typeof message === 'object' && message?.error?.message?.includes('CLIENT_FETCH_ERROR')) {
    return
  }
  // Filter out KARAT 404 errors that are expected in some cases
  if (typeof message === 'string' && message.includes('KARAT direct fetch error: 404')) {
    return
  }
  originalConsoleError.apply(console, args)
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // Výchozí 24 hodin, bude dynamicky upraveno
  },
  jwt: {
    maxAge: 24 * 60 * 60, // Výchozí 24 hodin, bude dynamicky upraveno
  },
  logger: customLogger,
  
  // Cookie settings pro HTTP development
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Důležité pro HTTP
        domain: process.env.NODE_ENV === 'production' ? '.itman.cz' : undefined
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Důležité pro HTTP
        domain: process.env.NODE_ENV === 'production' ? '.itman.cz' : undefined
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Důležité pro HTTP
        domain: process.env.NODE_ENV === 'production' ? '.itman.cz' : undefined
      }
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Důležité pro HTTP
        domain: process.env.NODE_ENV === 'production' ? '.itman.cz' : undefined
      }
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Důležité pro HTTP
        domain: process.env.NODE_ENV === 'production' ? '.itman.cz' : undefined
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      logger.log('JWT callback - user:', user, 'token:', token, 'account:', account)
      
      if (user) {
        token.role = user.role
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.authProvider = user.authProvider
        
        // Načíst uživatelské preference pro nastavení délky session
        try {
          const userPrefs = await prisma.user.findUnique({
            where: { id: user.id },
            select: { rememberLogin: true, sessionPreference: true }
          })
          
          if (userPrefs) {
            token.rememberLogin = userPrefs.rememberLogin
            token.sessionPreference = userPrefs.sessionPreference
            
            // Nastavit dynamickou délku session
            const sessionAge = userPrefs.sessionPreference === 'REMEMBER' ? 24 * 60 * 60 : 1 * 60 * 60
            token.maxAge = sessionAge
            logger.log('Session maxAge set to:', sessionAge, 'seconds for user:', user.email)
          }
        } catch (error) {
          logger.error('Error loading user preferences for JWT:', error)
          // Výchozí hodnota pokud se nepodaří načíst preference
          token.maxAge = 24 * 60 * 60
        }
      }
      
      // Handle Azure AD token
      if (account?.provider === 'azure-ad' && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      
      return token
    },
    async session({ session, token }) {
      logger.log('Session callback - token:', token)
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.accessToken = token.accessToken as string
        session.authProvider = token.authProvider as AuthProvider
        
        // Set session expiration to match JWT expiration
        const expiresAt = token.expiresAt 
          ? new Date(token.expiresAt * 1000).toISOString()
          : new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
        
        session.expires = expiresAt
      }
      
      logger.log('Final session:', session)
      return session
    },
    async signIn({ user, account, profile }) {
      logger.log('SignIn callback - user:', user, 'account:', account, 'profile:', profile)
      
      if (account?.provider === 'azure-ad') {
        try {
          // Extract email from profile if user.email is undefined
          const userEmail = user.email || profile?.email || profile?.preferred_username
          
          if (!userEmail) {
            logger.error('No email found in Azure AD profile')
            return false
          }
          
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
          })
          
          if (existingUser) {
            // Update existing user with Azure AD info
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                externalId: profile?.oid || profile?.sub,
                authProvider: 'AZURE_AD',
                isActive: true,
                updatedAt: new Date()
              }
            })
            
            // Set user ID for JWT callback
            user.id = existingUser.id
            user.role = existingUser.role
            user.authProvider = 'AZURE_AD'
            user.email = userEmail
          } else {
            // Create new user from Azure AD
            const newUser = await prisma.user.create({
              data: {
                email: userEmail,
                name: user.name || userEmail.split('@')[0],
                externalId: profile?.oid || profile?.sub,
                authProvider: 'AZURE_AD',
                role: 'USER', // Default role for new users
                isActive: true
              }
            })
            
            user.id = newUser.id
            user.role = newUser.role
            user.authProvider = 'AZURE_AD'
            user.email = userEmail
          }
          
          return true
        } catch (error) {
          logger.error('Error during Azure AD user creation/update:', error)
          return false
        }
      }
      
      return true
    }
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('=== AUTH DEBUG START ===')
        console.log('Auth attempt:', credentials?.email)
        logger.log('Auth attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          logger.log('Missing credentials')
          return null
        }
        
        try {
          console.log('Looking for user:', credentials.email)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })
          
          console.log('User found:', !!user)
          if (user) {
            console.log('User details:', { email: user.email, hasPassword: !!user.password, role: user.role, isActive: user.isActive })
          }
          
          if (user && user.password && (await bcrypt.compare(credentials.password, user.password))) {
            console.log('Auth successful for:', credentials?.email)
            logger.log('Auth successful for:', credentials?.email)
            const result = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              authProvider: user.authProvider
            }
            console.log('Returning user object:', result)
            return result
          } else {
            console.log('Auth failed: Invalid password for:', credentials?.email)
            logger.log('Auth failed: Invalid password for:', credentials?.email)
            return null
          }
        } catch (error) {
          console.log('Auth error:', error)
          logger.error('Auth error:', error)
          return null
        } finally {
          console.log('=== AUTH DEBUG END ===')
        }
      }
    }),
    // Azure AD provider - aktivní pokud jsou nastaveny environment variables
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
      ? (() => {
          const config = azureADProviderConfig()
          return config ? [config] : []
        })()
      : [])
  ],
  pages: {
    signIn: '/login',
  },
  events: {
    async signOut({ session, token }) {
      logger.log('User signed out:', session?.user?.email)
      logger.log('Session invalidation complete')
      
      // Explicitní cleanup session dat
      if (session?.user?.id) {
        try {
          // Zde můžete přidat další cleanup operace pokud jsou potřeba
          // Například smazání dočasných dat, logování atd.
          logger.log(`User ${session.user.email} (${session.user.id}) signed out successfully`)
        } catch (error) {
          logger.error('Error during signOut cleanup:', error)
        }
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      logger.log('User signed in:', user.email)
    }
  },
}

// Pomocná funkce pro získání session na serveru
import { getServerSession } from 'next-auth'

export async function getSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    logger.error('Error getting session:', error)
    return null
  }
}

// Get Microsoft Graph access token from session
export function getAccessToken(session: any): string | null {
  // Pro Azure AD uživatele by měl být access token v session
  if (session?.accessToken) {
    return session.accessToken as string
  }
  return null
}

// Helper function to check if user has specific role
export function hasRole(session: any, role: UserRole): boolean {
  return session?.user?.role === role
}

// Helper function to check if user is admin
export function isAdmin(session: any): boolean {
  return hasRole(session, 'ADMIN')
}

// Helper function to check if user is IT
export function isIT(session: any): boolean {
  return hasRole(session, 'IT') || isAdmin(session)
}

// Helper function to handle session errors gracefully
export function handleSessionError(error: any) {
  if (error?.message?.includes('CLIENT_FETCH_ERROR')) {
    logger.warn('Session fetch error - user may be logged out')
    return null
  }
  logger.error('Session error:', error)
  return null
}

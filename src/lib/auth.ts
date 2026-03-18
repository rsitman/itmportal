import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole, AuthProvider } from '@prisma/client'
import { customLogger } from './nextauth-logger'
import { logger } from './logger'
import { getServerSession } from 'next-auth'

type SafeUserSummary = {
  id: string
  email: string
  name?: string | null
  role: UserRole
  authProvider: AuthProvider
}

type ImpersonationState = {
  active: boolean
  originalUser: SafeUserSummary
  targetUser: SafeUserSummary
}

function isSafeUserRole(value: unknown): value is UserRole {
  return value === 'ADMIN' || value === 'USER' || value === 'IT'
}

function isSafeAuthProvider(value: unknown): value is AuthProvider {
  return value === 'LOCAL' || value === 'AZURE_AD'
}

function toSafeUserSummary(value: unknown): SafeUserSummary | null {
  if (!value || typeof value !== 'object') return null
  const v = value as any
  if (typeof v.id !== 'string' || !v.id.trim()) return null
  if (typeof v.email !== 'string' || !v.email.trim()) return null
  if (!isSafeUserRole(v.role)) return null
  if (!isSafeAuthProvider(v.authProvider)) return null
  const name =
    v.name === null || v.name === undefined
      ? null
      : typeof v.name === 'string'
        ? v.name
        : null
  return {
    id: v.id.trim(),
    email: v.email.trim(),
    name,
    role: v.role,
    authProvider: v.authProvider,
  }
}

function getTokenIdentity(token: any): SafeUserSummary | null {
  if (!token) return null
  const id = typeof token.id === 'string' ? token.id : ''
  const email = typeof token.email === 'string' ? token.email : ''
  const role = token.role
  const authProvider = token.authProvider
  const name = typeof token.name === 'string' ? token.name : null

  if (!id.trim() || !email.trim()) return null
  if (!isSafeUserRole(role)) return null
  if (!isSafeAuthProvider(authProvider)) return null

  return { id: id.trim(), email: email.trim(), name, role, authProvider }
}

// Jednoduchý check env proměnných pro Azure AD
const AZURE_ENV_OK = Boolean(
  process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID,
)

if (process.env.NODE_ENV === 'development') {
  console.log('=== AZURE DEBUG ===')
  console.log('AZURE_ENV_OK:', AZURE_ENV_OK)
  console.log('CLIENT_ID:', !!process.env.AZURE_AD_CLIENT_ID)
  console.log('SECRET length:', process.env.AZURE_AD_CLIENT_SECRET?.length)
  console.log('TENANT_ID:', !!process.env.AZURE_AD_TENANT_ID)
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
}

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
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  logger: customLogger,

  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
        token.email = user.email
        token.name = user.name
        token.authProvider = (user as any).authProvider
      }

      if (account?.provider === 'azure-ad' && account.access_token) {
        token.accessToken = account.access_token
        token.expiresAt = account.expires_at
      }

      // Impersonation state is updated only through an explicit session.update() call on the client.
      if (trigger === 'update') {
        const payload = (session as any)?.impersonation
        const action = payload?.action

        if (action === 'stop') {
          delete (token as any).impersonation
          if (process.env.NODE_ENV === 'development') {
            console.info('[impersonation] jwt update stop', { tokenHasImpersonation: Boolean((token as any).impersonation) })
          }
        }

        if (action === 'start') {
          const currentIdentity = getTokenIdentity(token)
          const targetUser = toSafeUserSummary(payload?.targetUser)

          // Conservative validation: require a stable current identity + safe target payload.
          if (
            currentIdentity &&
            currentIdentity.role === 'ADMIN' &&
            targetUser &&
            targetUser.role !== 'ADMIN' &&
            targetUser.id !== currentIdentity.id
          ) {
            // No chaining: if already impersonating, ignore start.
            const existing = (token as any).impersonation as ImpersonationState | undefined
            if (!existing?.active) {
              ;(token as any).impersonation = {
                active: true,
                originalUser: currentIdentity,
                targetUser,
              } satisfies ImpersonationState
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.info('[impersonation] jwt update start', {
              ok: Boolean((token as any).impersonation?.active),
              adminId: currentIdentity?.id,
              targetId: targetUser?.id,
            })
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        const impersonation = (token as any).impersonation as ImpersonationState | undefined
        const isImpersonating = Boolean(impersonation?.active && impersonation?.targetUser?.id)

        const effectiveUser = isImpersonating ? impersonation!.targetUser : null

        ;(session.user as any).id = (effectiveUser?.id ?? (token.id as string)) as string
        ;(session.user as any).role = (effectiveUser?.role ?? (token.role as UserRole)) as UserRole
        session.user.email = (effectiveUser?.email ?? (token.email as string)) as string
        session.user.name = (effectiveUser?.name ?? (token.name as string)) as string

        ;(session as any).authProvider = token.authProvider as AuthProvider
        // Conservative: do not expose Graph access token while impersonating.
        if (!isImpersonating && token.accessToken) {
          ;(session as any).accessToken = token.accessToken
        }

        if (isImpersonating) {
          ;(session as any).impersonation = {
            active: true,
            originalUser: impersonation!.originalUser,
            targetUser: impersonation!.targetUser,
          }
        } else {
          ;(session as any).impersonation = { active: false }
        }

        const expiresAt = token.expiresAt
          ? new Date(token.expiresAt * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        session.expires = expiresAt
      }

      return session
    },

    async signIn({ user, account, profile }) {
      logger.log('SignIn callback - user:', user, 'account:', account, 'profile:', profile)

      if (account?.provider === 'azure-ad') {
        try {
          const userEmail =
            user.email ||
            (profile as any)?.preferred_username ||
            (profile as any)?.email ||
            (profile as any)?.upn ||
            (profile as any)?.mail

          logger.log('Azure AD signIn - userEmail resolved:', userEmail)
          logger.log('Azure AD signIn - user.email:', user.email)
          logger.log('Azure AD signIn - profile keys:', profile ? Object.keys(profile) : 'no profile')

          if (!userEmail) {
            logger.error('No email found in Azure AD profile. user:', JSON.stringify(user), 'profile:', JSON.stringify(profile))
            return false
          }

          const externalId = (profile as any)?.oid || (profile as any)?.sub

          // Hledat nejprve podle externalId (OID), pak podle emailu
          const existingUser =
            (externalId
              ? await prisma.user.findFirst({ where: { externalId } })
              : null) ??
            (await prisma.user.findFirst({
              where: { email: { equals: userEmail, mode: 'insensitive' } },
            }))

          logger.log('Azure AD signIn - existingUser found:', !!existingUser, existingUser?.email)

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                externalId,
                authProvider: 'AZURE_AD',
                isActive: true,
                updatedAt: new Date(),
              },
            })

            ;(user as any).id = existingUser.id
            ;(user as any).role = existingUser.role
            ;(user as any).authProvider = 'AZURE_AD'
            user.email = userEmail
          } else {
            const newUser = await prisma.user.create({
              data: {
                email: userEmail,
                name: user.name || userEmail.split('@')[0],
                externalId,
                authProvider: 'AZURE_AD',
                role: 'USER',
                isActive: true,
              },
            })

            ;(user as any).id = newUser.id
            ;(user as any).role = newUser.role
            ;(user as any).authProvider = 'AZURE_AD'
            user.email = userEmail
          }

          return true
        } catch (error) {
          logger.error('Error during Azure AD user creation/update:', error)
          logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
          return false
        }
      }

      return true
    },
  },

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
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
            where: { email: credentials.email as string },
          })

          console.log('User found:', !!user)
          if (user) {
            console.log('User details:', {
              email: user.email,
              hasPassword: !!user.password,
              role: user.role,
              isActive: user.isActive,
            })
          }

          if (user && user.password && (await bcrypt.compare(credentials.password, user.password))) {
            console.log('Auth successful for:', credentials?.email)
            logger.log('Auth successful for:', credentials?.email)
            const result = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              authProvider: user.authProvider,
            }
            console.log('Returning user object:', result)
            return result
          } else {
            console.log('Auth failed: Invalid password for:', credentials?.email)
            logger.log('Auth failed: Invalid password for:', credentials?.email)
            return null
          }
        } catch (error) {
          logger.error('Auth error:', error)
          return null
        } finally {
          console.log('=== AUTH DEBUG END ===')
        }
      },
    }),

    ...(AZURE_ENV_OK
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
            authorization: {
              params: {
                scope: 'openid profile email User.Read',
              },
            },
            profile(profile) {
              logger.log('Azure AD profile received:', profile)
              const email =
                (profile as any).preferred_username ||
                (profile as any).email ||
                (profile as any).upn ||
                (profile as any).mail
              return {
                id: (profile as any).oid || (profile as any).sub,
                name: (profile as any).name,
                email,
                emailVerified: null,
              }
            },
            checks: ['state'],
          }),
        ]
      : []),
  ],

  pages: {
    signIn: '/login',
  },

  events: {
    async signOut({ session }) {
      logger.log('User signed out:', session?.user?.email)
      logger.log('Session invalidation complete')

      if (session?.user?.id) {
        try {
          logger.log(
            `User ${session.user.email} (${(session.user as any).id}) signed out successfully`,
          )
        } catch (error) {
          logger.error('Error during signOut cleanup:', error)
        }
      }
    },
    async signIn({ user }) {
      logger.log('User signed in:', user.email)
    },
  },
}

// Pomocná funkce pro získání session na serveru
export async function getSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    logger.error('Error getting session:', error)
    return null
  }
}

export function getAccessToken(session: any): string | null {
  if (session?.accessToken) {
    return session.accessToken as string
  }
  return null
}

export function hasRole(session: any, role: UserRole): boolean {
  return session?.user?.role === role
}

export function isAdmin(session: any): boolean {
  return hasRole(session, 'ADMIN')
}

export function isIT(session: any): boolean {
  return hasRole(session, 'IT') || isAdmin(session)
}

export function handleSessionError(error: any) {
  if (error?.message?.includes('CLIENT_FETCH_ERROR')) {
    logger.warn('Session fetch error - user may be logged out')
    return null
  }
  logger.error('Session error:', error)
  return null
}

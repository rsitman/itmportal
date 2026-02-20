import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { UserRole } from '@prisma/client'
//import OAuthProvider from 'next-auth/providers/oauth'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
  },
  debug: true,
  useSecureCookies: true,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role ?? 'USER'
      }
      if (account?.provider === 'azure-ad') {
        token.id = token.sub ?? ''
        token.email = token.email ?? ''
        token.name = token.name ?? ''
        token.role = 'USER' as UserRole
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token })
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as UserRole
      }
      return session
    }
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.email === 'admin' && credentials?.password === 'admin') {
	  console.log('🚨 CREDENTIALS HIT:', credentials?.email)
	  console.log('ADMIN LOGIN OK')
          return {
            id: '1',
            email: 'admin',
            name: 'Admin User',
            role: 'ADMIN' as UserRole
          }
        }
	console.log('AUTH FAIL')
        return null
      }
    }),

    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID ? [{
	  id: "azure-ad",
	  name: "Azure AD",
	  type: "oauth" as const,
	  clientId: process.env.AZURE_AD_CLIENT_ID!,
	  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
	  authorization: {
	    url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
	    params: { scope: "openid profile email" },
	  },
	  token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
	  userinfo: `https://graph.microsoft.com/oidc/userinfo`,
	  profile(profile: Record<string, any>) {
	    return {
	      id: profile.sub,
	      name: profile.email || profile.name,
	      email: profile.email,
	    }
	  },
	}
    ] : [])
  ]
}

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

export function hasRole(session: any, role: UserRole): boolean {
  return session?.user?.role === role
}

export function isAdmin(session: any): boolean {
  return hasRole(session, 'ADMIN')
}

export function isIT(session: any): boolean {
  return hasRole(session, 'IT') || isAdmin(session)
}

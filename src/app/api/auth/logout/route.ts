import { NextRequest, NextResponse } from 'next/server'
import { getEntraIDConfig } from '@/lib/entra-id'

export async function POST(request: NextRequest) {
  try {
    const entraConfig = getEntraIDConfig()

    // Číst email z body pro logout_hint (volitelné)
    let email: string | undefined
    try {
      const body = await request.json()
      email = body?.email
    } catch {
      // body je volitelné
    }

    if (entraConfig) {
      const postLogoutRedirectUri = encodeURIComponent(
        (process.env.NEXTAUTH_URL ?? 'http://localhost:3000') + '/login'
      )
      const params = new URLSearchParams({
        post_logout_redirect_uri: (process.env.NEXTAUTH_URL ?? 'http://localhost:3000') + '/login',
      })
      // logout_hint zajistí odhlášení konkrétního účtu bez výběru
      if (email) {
        params.set('logout_hint', email)
      }

      const logoutUrl = `https://login.microsoftonline.com/${entraConfig.tenantId}/oauth2/v2.0/logout?${params.toString()}`

      return NextResponse.json({ success: true, logoutUrl })
    }

    // Lokální uživatel — žádná Azure AD akce
    return NextResponse.json({ success: true, logoutUrl: null })
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

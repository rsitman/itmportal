import { NextRequest, NextResponse } from 'next/server'
import { getEntraIDConfig } from '@/lib/entra-id'

export async function POST(request: NextRequest) {
  try {
    const entraConfig = getEntraIDConfig()
    
    // Create response with cleared session cookies
    const response = NextResponse.json({ 
      success: true,
      message: 'Logout successful'
    })
    
    // Clear NextAuth session cookies
    response.cookies.set('next-auth.session-token', '', { 
      expires: new Date(0),
      path: '/' 
    })
    response.cookies.set('next-auth.csrf-token', '', { 
      expires: new Date(0),
      path: '/' 
    })
    response.cookies.set('next-auth.callback-url', '', { 
      expires: new Date(0),
      path: '/' 
    })
    
    // Clear Azure AD cookies if configured
    if (entraConfig) {
      // Build Azure AD logout URL
      const logoutUrl = `https://login.microsoftonline.com/${entraConfig.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/login')}`
      
      // Update response with logout URL
      response.cookies.set('logout_url', logoutUrl, { 
        path: '/',
        httpOnly: false
      })
      
      return NextResponse.json({ 
        success: true,
        logoutUrl 
      })
    }
    
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

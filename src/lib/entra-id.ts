import { OAuthConfig } from 'next-auth/providers/oauth'
import { logger } from '@/lib/logger'

// Konfigurace pro Entra ID integraci
// Tento soubor připravuje strukturu pro budoucí integraci s Microsoft Entra ID

export interface EntraIDConfig {
  clientId: string
  clientSecret: string
  tenantId: string
  redirectUri: string
}

export const getEntraIDConfig = (): EntraIDConfig | null => {
  const clientId = process.env.AZURE_AD_CLIENT_ID
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
  const tenantId = process.env.AZURE_AD_TENANT_ID
  const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/callback/azure-ad'

  if (!clientId || !clientSecret || !tenantId) {
    logger.warn('Entra ID configuration is missing. Check environment variables.')
    return null
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri
  }
}

// Funkce pro budoucí implementaci Azure AD provider
export const azureADProviderConfig = (): OAuthConfig<any> | null => {
  const config = getEntraIDConfig()
  
  if (!config) {
    return null
  }

  return {
    id: 'azure-ad',
    name: 'Azure Active Directory',
    type: 'oauth',
    authorization: {
      url: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`,
      params: {
        scope: 'openid profile email User.Read Calendars.ReadWrite offline_access',
        response_type: 'code',
      },
    },
    token: `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    userinfo: 'https://graph.microsoft.com/v1.0/me',
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    issuer: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
    jwks_endpoint: `https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`,
    profile: (profile: any) => {
      return {
        id: profile.oid || profile.sub, // Azure používá 'oid' nebo 'sub'
        name: profile.displayName || profile.name,
        email: profile.mail || profile.userPrincipalName,
        image: profile.photo,
      }
    },
  }
}

// Příklad použití v NextAuth konfiguraci:
/*
import { azureADProviderConfig } from '@/lib/entra-id'

// V authOptions přidat:
if (process.env.AZURE_AD_CLIENT_ID) {
  providers.push(azureADProviderConfig())
}
*/

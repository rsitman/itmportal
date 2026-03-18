// Custom logger to suppress CLIENT_FETCH_ERROR warnings
export const customLogger = {
  error: (message: string, ...args: any[]) => {
    // Suppress CLIENT_FETCH_ERROR as it's expected behavior when not authenticated
    if (typeof message === 'string' && message.includes('CLIENT_FETCH_ERROR')) {
      return
    }

    // Entra ID: invalid client secret (common local misconfig)
    if (typeof message === 'string' && message.includes('AADSTS7000215')) {
      console.error(
        '[auth] Entra invalid_client (AADSTS7000215). ' +
          'Check AZURE_AD_CLIENT_SECRET: use the Secret VALUE (not Secret ID) and ensure it is not expired.',
      )
      return
    }
    
    // Suppress other common NextAuth errors that are expected behavior
    if (typeof message === 'string' && (
      message.includes('NEXTAUTH_URL') ||
      message.includes('session') && message.includes('401')
    )) {
      return
    }
    
    console.error(message, ...args)
  },
  warn: (message: string, ...args: any[]) => {
    // Suppress CLIENT_FETCH_ERROR warnings
    if (typeof message === 'string' && message.includes('CLIENT_FETCH_ERROR')) {
      return
    }
    console.warn(message, ...args)
  },
  debug: process.env.NODE_ENV === 'development' ? console.debug : () => {},
  info: console.info
}

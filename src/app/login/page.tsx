'use client'

import { useState, useEffect, use } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

type SearchParams = Promise<{ callbackUrl?: string }>
type Provider = { id: string; name: string; type: string }

export default function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [showLoginAsDifferent, setShowLoginAsDifferent] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  // Unwrap searchParams with React.use()
  const params = searchParams ? use(searchParams) : {}

  // Zpracování callbackUrl a prevence smyček
  const getSafeCallbackUrl = () => {
    if (!params?.callbackUrl) return '/dashboard'

    const callbackUrl = decodeURIComponent(params.callbackUrl)

    // Pokud callbackUrl obsahuje login, je to smyčka - použijeme výchozí
    if (callbackUrl.includes('/login')) {
      return '/dashboard'
    }

    return callbackUrl
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load CSRF token
        const csrfRes = await fetch('/api/auth/csrf')
        const csrfData = await csrfRes.json()
        setCsrfToken(csrfData.csrfToken)

        // Load providers (vrací objekt s klíči = id providerů)
        const providersRes = await fetch('/api/auth/providers')
        const providersData: Record<string, Provider> = await providersRes.json()
        setProviders(providersData)
        logger.log('Available providers:', providersData)
      } catch (error) {
        logger.warn('Failed to load auth data:', error)
      }
    }

    const loadUserPreferences = async () => {
      if ((session as any)?.user?.id) {
        try {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const prefs = await response.json()
            setUserPreferences(prefs)
          }
        } catch (error) {
          logger.error('Error loading user preferences:', error)
        }
      }
    }

    loadData()
    loadUserPreferences()
  }, [session])

  const handleContinueAsUser = () => {
    router.push('/dashboard')
  }

  const handleLoginAsDifferent = async () => {
    setIsLoading(true)
    try {
      // Odhlásit aktuálního uživatele
      await signOut({ redirect: false })
      setShowLoginAsDifferent(true)
    } catch (error) {
      logger.error('Error during sign out:', error)
      setError('Došlo k chybě při odhlášení')
    } finally {
      setIsLoading(false)
    }
  }

  const azureProvider = providers?.['azure-ad']
  const shouldShowContinueOption = userPreferences?.rememberLogin !== false

  // Pokud existuje session a uživatel nechce se přihlásit jako jiný
  if (session && !showLoginAsDifferent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Již jste přihlášen
            </h2>
            <div className="mt-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p className="mt-2 text-lg font-medium text-gray-900">
                {session.user?.name}
              </p>
              <p className="text-sm text-gray-600">
                {session.user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(session as any).authProvider === 'AZURE_AD' ? 'Azure AD' : 'Lokální účet'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {shouldShowContinueOption && (
              <button
                onClick={handleContinueAsUser}
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Pokračovat jako {session.user?.name}
              </button>
            )}

            <button
              onClick={handleLoginAsDifferent}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Odhlašování...' : 'Přihlásit se jako jiný uživatel'}
            </button>
          </div>

          {userPreferences && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p>
                <strong>Nastavení pamatování:</strong>{' '}
                {userPreferences.rememberLogin ? 'Zapnuto (24h)' : 'Vypnuto (1h)'}
              </p>
              {!userPreferences.rememberLogin && (
                <p className="mt-1 text-orange-600">
                  Protože máte vypnuté pamatování, budete se muset přihlašovat častěji.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Standardní login formulář
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Přihlášení do portálu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Použijte admin@firma.cz / admin123 pro přihlášení
          </p>
          {session && showLoginAsDifferent && (
            <p className="mt-2 text-center text-sm text-green-600">
              Odhlášeni z předchozího účtu. Zadejte nové přihlašovací údaje.
            </p>
          )}
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setIsLoading(true)
            setError('')
            const formData = new FormData(e.currentTarget)
            const result = await signIn('credentials', {
              email: formData.get('email') as string,
              password: formData.get('password') as string,
              redirect: false,
            })
            setIsLoading(false)
            if (result?.error) {
              setError('Nesprávný email nebo heslo')
            } else {
              router.push(getSafeCallbackUrl())
            }
          }}
        >
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Uživatelské jméno
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2 border"
                placeholder="admin@firma.cz"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2 border"
                placeholder="admin123"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Přihlašování...' : 'Přihlásit se'}
            </button>
          </div>
        </form>

        {/* Azure AD Login */}
        {azureProvider && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Nebo se přihlaste pomocí
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => signIn('azure-ad', { callbackUrl: getSafeCallbackUrl() }, { prompt: 'select_account' })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 1.02C6.62 1.33 3 5.52 3 10.31V20h6v-8h4v8h6V10c0-4.97-4.03-9-9-9-.2 0-.4 0-.6.02z" />
                </svg>
                Sign in with Azure Active Directory
              </Button>
            </div>
          </div>
        )}

        {/* Debug info */}
        {providers && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Dostupné providery:</strong>{' '}
            {Object.keys(providers).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

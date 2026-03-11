'use client'

import { useState, useEffect, use } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

type SearchParams = Promise<{ callbackUrl?: string }>
type Provider = { id: string; name: string; type: string }

const ITMAN_LOGO_URL = 'https://www.itman.cz/wp-content/uploads/2023/11/ITMAN-Logo.png'

function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center app-shell-bg p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700/60 bg-gray-800/80 shadow-xl p-8 space-y-6">
      {children}
    </div>
  )
}

export default function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [showLoginAsDifferent, setShowLoginAsDifferent] = useState(false)
  const [showLocalLogin, setShowLocalLogin] = useState(false)
  const { data: session } = useSession()

  const params = searchParams ? use(searchParams) : {}

  const getSafeCallbackUrl = () => {
    if (!params?.callbackUrl) return '/dashboard'
    const callbackUrl = decodeURIComponent(params.callbackUrl)
    if (callbackUrl.includes('/login')) return '/dashboard'
    return callbackUrl
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const providersRes = await fetch('/api/auth/providers')
        const providersData: Record<string, Provider> = await providersRes.json()
        setProviders(providersData)
        logger.log('Available providers:', providersData)
      } catch (err) {
        logger.warn('Failed to load auth data:', err)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (providers && !providers['azure-ad'] && providers['credentials']) {
      setShowLocalLogin(true)
    }
  }, [providers])

  useEffect(() => {
    const loadUserPreferences = async () => {
      if ((session as any)?.user?.id) {
        try {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const prefs = await response.json()
            setUserPreferences(prefs)
          }
        } catch (err) {
          logger.error('Error loading user preferences:', err)
        }
      }
    }

    loadUserPreferences()
  }, [session])

  const handleContinueAsUser = () => {
    window.location.href = getSafeCallbackUrl()
  }

  const handleLoginAsDifferent = async () => {
    setIsLoading(true)
    setError('')
    try {
      await signOut({ redirect: false })
      setShowLoginAsDifferent(true)
    } catch (err) {
      logger.error('Error during sign out:', err)
      setError('Došlo k chybě při odhlášení')
    } finally {
      setIsLoading(false)
    }
  }

  const azureProvider = providers?.['azure-ad']
  const credentialsProvider = providers?.['credentials']
  const shouldShowContinueOption = userPreferences?.rememberLogin !== false

  // Stav: již přihlášen
  if (session && !showLoginAsDifferent) {
    return (
      <LoginLayout>
        <LoginCard>
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Již jste přihlášen
            </h2>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-accent-600 flex items-center justify-center text-white text-lg font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p className="font-medium text-white">{session.user?.name}</p>
              <p className="text-sm text-gray-400">{session.user?.email}</p>
              <p className="text-xs text-gray-500">
                {(session as any).authProvider === 'AZURE_AD' ? 'Azure AD' : 'Lokální účet'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {shouldShowContinueOption && (
              <Button
                onClick={handleContinueAsUser}
                className="w-full"
                variant="default"
              >
                Pokračovat do portálu
              </Button>
            )}
            <Button
              onClick={handleLoginAsDifferent}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/80 hover:text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Odhlašování...' : 'Přihlásit se jako jiný uživatel'}
            </Button>
          </div>

          {userPreferences && (
            <div className="pt-2 border-t border-gray-700/60 text-xs text-gray-400">
              <strong className="text-gray-300">Pamatování přihlášení:</strong>{' '}
              {userPreferences.rememberLogin ? 'Zapnuto (24h)' : 'Vypnuto (1h)'}
              {!userPreferences.rememberLogin && (
                <span className="block mt-1 text-amber-400/90">
                  Budete se muset přihlašovat častěji.
                </span>
              )}
            </div>
          )}
        </LoginCard>
      </LoginLayout>
    )
  }

  // Stav: přihlašovací formulář
  return (
    <LoginLayout>
      {/* Branding */}
      <div className="text-center mb-6">
        <img
          src={ITMAN_LOGO_URL}
          alt="ITMAN"
          className="h-7 w-auto mx-auto mb-4 opacity-95"
        />
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Interní servisní portál
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Přihlaste se firemním účtem Microsoft. Lokální účet jen pro administrativní přístup.
        </p>
      </div>

      <LoginCard>
        {session && showLoginAsDifferent && (
          <div className="rounded-md bg-accent-900/30 border border-accent-700/50 px-3 py-2 text-sm text-accent-200">
            Odhlášeni z předchozího účtu. Zadejte nové přihlašovací údaje.
          </div>
        )}

        {/* Primární CTA: Azure AD */}
        {azureProvider && (
          <div className="space-y-4">
            <Button
              onClick={() =>
                signIn('azure-ad', { callbackUrl: getSafeCallbackUrl() }, { prompt: 'select_account' })
              }
              className="w-full h-12 text-base"
              variant="default"
            >
              <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 21 21" fill="none" aria-hidden>
                <path d="M10.5 0H0v10.5h10.5V0z" fill="#f25022" />
                <path d="M21 0h-10.5v10.5H21V0z" fill="#7fba00" />
                <path d="M10.5 10.5H0V21h10.5V10.5z" fill="#00a4ef" />
                <path d="M21 10.5h-10.5V21H21V10.5z" fill="#ffb900" />
              </svg>
              Přihlásit přes Microsoft
            </Button>
          </div>
        )}

        {/* Sekundární: lokální administrátorské přihlášení (collapsible) */}
        {credentialsProvider && (
          <div className="pt-2 border-t border-gray-700/60">
            <button
              type="button"
              onClick={() => setShowLocalLogin((v) => !v)}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded"
            >
              {showLocalLogin ? 'Skrýt lokální přihlášení' : 'Lokální administrátorské přihlášení'}
            </button>

            {showLocalLogin && (
              <form
                className="mt-4 space-y-4"
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
                    window.location.href = getSafeCallbackUrl()
                  }
                }}
              >
                {error && (
                  <div className="rounded-md bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-1">
                    Uživatelské jméno
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="text"
                    required
                    autoComplete="username"
                    className="block w-full rounded-lg border border-gray-600 bg-gray-900/80 text-white placeholder-gray-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-0 px-3 py-2 text-sm"
                    placeholder="např. admin@firma.cz"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1">
                    Heslo
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-lg border border-gray-600 bg-gray-900/80 text-white placeholder-gray-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/50 focus:ring-offset-0 px-3 py-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full disabled:opacity-90 disabled:text-gray-900"
                  variant="secondary"
                >
                  {isLoading ? 'Přihlašování...' : 'Přihlásit lokálním účtem'}
                </Button>
              </form>
            )}
          </div>
        )}
      </LoginCard>
    </LoginLayout>
  )
}

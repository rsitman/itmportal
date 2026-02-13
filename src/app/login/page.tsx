'use client'

import { useState } from 'react'
import { signIn, signOut, getProviders, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<any>(null)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [showLoginAsDifferent, setShowLoginAsDifferent] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const availableProviders = await getProviders()
        setProviders(availableProviders)
        console.log('Available providers:', availableProviders)
      } catch (error) {
        console.warn('Failed to load providers:', error)
        setProviders({
          credentials: { id: 'credentials', name: 'Credentials', type: 'credentials' },
          'azure-ad': { id: 'azure-ad', name: 'Azure Active Directory', type: 'oauth' }
        })
      }
    }

    const loadUserPreferences = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const prefs = await response.json()
            setUserPreferences(prefs)
          }
        } catch (error) {
          console.error('Error loading user preferences:', error)
        }
      }
    }

    loadProviders()
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
      console.error('Error during sign out:', error)
      setError('Došlo k chybě při odhlášení')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email,
        password: password,
        redirect: false, // Manuální přesměrování pro lepší kontrolu
      })

      if (result?.error) {
        setError('Neplatné přihlašovací údaje')
      } else if (result?.ok) {
        // Úspěšné přihlášení - přesměrovat na dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Došlo k chybě při přihlašování')
    } finally {
      setIsLoading(false)
    }
  }

  // Pokud existuje session a uživatel nechce se přihlásit jako jiný
  if (session && !showLoginAsDifferent) {
    const shouldShowContinueOption = userPreferences?.rememberLogin !== false

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Již jste přihlášen
            </h2>
            <div className="mt-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p className="mt-2 text-lg font-medium text-gray-900">
                {session.user?.name}
              </p>
              <p className="text-sm text-gray-600">
                {session.user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {session.authProvider === 'AZURE_AD' ? 'Azure AD' : 'Lokální účet'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {shouldShowContinueOption && (
              <Button
                onClick={handleContinueAsUser}
                className="w-full"
                size="lg"
              >
                Pokračovat jako {session.user?.name}
              </Button>
            )}

            <Button
              onClick={handleLoginAsDifferent}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Odhlašování...' : 'Přihlásit se jako jiný uživatel'}
            </Button>
          </div>

          {userPreferences && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p>
                <strong>Nastavení pamatování:</strong> {' '}
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
            Použijte admin/admin pro přihlášení
          </p>
          {session && showLoginAsDifferent && (
            <p className="mt-2 text-center text-sm text-blue-600">
              Odhlášeni z předchozího účtu. Zadejte nové přihlašovací údaje.
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="admin"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Přihlašování...' : 'Přihlásit se'}
            </Button>
          </div>
        </form>

        {/* Azure AD Login */}
        {providers && providers['azure-ad'] && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Nebo se přihlaste pomocí</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 1.02C6.62 1.33 3 5.52 3 10.31V20h6v-8h4v8h6V10c0-4.97-4.03-9-9-9-.2 0-.4 0-.6.02z"/>
                </svg>
                Sign in with Azure Active Directory
              </Button>
            </div>
          </div>
        )}

        {/* Debug info */}
        {providers && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Dostupné providery:</strong> {Object.keys(providers).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

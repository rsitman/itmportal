'use client'

import { useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const availableProviders = await getProviders()
        setProviders(availableProviders)
        console.log('Available providers:', availableProviders)
      } catch (error) {
        console.warn('Failed to load providers:', error)
        // CLIENT_FETCH_ERROR is normal when not authenticated, continue anyway
        setProviders({
          credentials: { id: 'credentials', name: 'Credentials', type: 'credentials' },
          'azure-ad': { id: 'azure-ad', name: 'Azure Active Directory', type: 'oauth' }
        })
      }
    }
    loadProviders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: email,
        password: password,
        redirect: true, // Necháme NextAuth automaticky přesměrovat
      })

      if (result?.error) {
        setError('Neplatné přihlašovací údaje')
      } 
      // Pokud je redirect: true, NextAuth se postará o přesměrování sám
      // Nemusíme ručně volat router.push()
    } catch (error) {
      setError('Došlo k chybě při přihlašování')
    } finally {
      setIsLoading(false)
    }
  }

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

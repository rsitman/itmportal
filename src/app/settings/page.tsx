'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SessionPreference } from '@prisma/client'
import { logger } from '@/lib/logger'

interface UserPreferences {
  rememberLogin: boolean
  sessionPreference: SessionPreference
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences>({
    rememberLogin: true,
    sessionPreference: 'REMEMBER'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    loadPreferences()
  }, [session, status, router])

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/preferences')
      
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      } else {
        logger.error('Failed to load preferences')
      }
    } catch (error) {
      logger.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setIsSaving(true)
      setMessage('')

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setMessage('Nastavení bylo uloženo')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Chyba při ukládání nastavení')
      }
    } catch (error) {
      logger.error('Error saving preferences:', error)
      setMessage('Chyba při ukládání nastavení')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nastavení</h1>
        <p className="text-gray-600">Správa vašich osobních nastavení a preferencí</p>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informace o účtu</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div><strong>Jméno:</strong> {session.user?.name}</div>
          <div><strong>Email:</strong> {session.user?.email}</div>
          <div><strong>Role:</strong> {session.user?.role}</div>
          <div><strong>Poskytovatel:</strong> {session.authProvider === 'AZURE_AD' ? 'Azure AD' : 'Lokální'}</div>
        </div>
      </div>

      {/* Session Preferences */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Přihlašovací nastavení</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.rememberLogin}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  rememberLogin: e.target.checked,
                  sessionPreference: e.target.checked ? 'REMEMBER' : 'TEMPORARY'
                }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Pamatovat si přihlášení</div>
                <div className="text-sm text-gray-500">
                  {preferences.rememberLogin 
                    ? 'Zůstanete přihlášeni po dobu 24 hodin' 
                    : 'Odhlásíme vás po 1 hodině neaktivity'}
                </div>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Co to znamená?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>Pamatovat si (24h):</strong> Pohodlné pro osobní počítače. 
                  Session vyprší po 24 hodinách neaktivity. <strong>Poznámka:</strong> Tlačítko "Odhlásit se" vás vždy odhlásí okamžitě.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                <div>
                  <strong>Nepamatovat (1h):</strong> Bezpečné pro sdílené počítače. 
                  Session vyprší po 1 hodině neaktivity. <strong>Poznámka:</strong> Tlačítko "Odhlásit se" vás vždy odhlásí okamžitě.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Chování odhlašování</h3>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <strong>Důležité:</strong> Kliknutí na tlačítko "Odhlásit se" vždy provede úplné odhlášení 
                z aplikace i z Microsoft účtu, bez ohledu na toto nastavení. 
                Toto nastavení ovlivňuje pouze automatické odhlášení po neaktivitě.
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.includes('uloženo') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={savePreferences}
            disabled={isSaving}
            className="px-6"
          >
            {isSaving ? 'Ukládání...' : 'Uložit nastavení'}
          </Button>
        </div>
      </div>

      {/* Other Settings Links */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Další nastavení</h2>
        <div className="space-y-2">
          <a
            href="/settings/hwsw"
            className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">HW/SW Konfigurace</div>
            <div className="text-sm text-gray-600">Správa hardwaru a softwaru ve společnosti</div>
          </a>
          {session.user?.role === 'ADMIN' && (
            <a
              href="/settings/roles"
              className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Správa rolí</div>
              <div className="text-sm text-gray-600">Uživatelské role a oprávnění</div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

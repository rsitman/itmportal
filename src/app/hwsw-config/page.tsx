'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { HwswConfig } from '@/types/hwsw-config'

function HwswConfigContent() {
  const searchParams = useSearchParams()
  const projekt = searchParams.get('projekt')
  const [config, setConfig] = useState<HwswConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fw_pristupy: true,
    dom_users: true,
    set_send_mail: true,
    ext_sluzby: true,
    servery: true
  })

  useEffect(() => {
    if (!projekt) {
      setError('Projekt parameter is required')
      setLoading(false)
      return
    }

    fetchConfig()
  }, [projekt])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/hwsw-config?projekt=${encodeURIComponent(projekt || '')}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`)
      }
      
      const data = await response.json()
      setConfig(data)
    } catch (error: any) {
      // console.error('Error fetching HWSW config:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const maskPassword = (value: string) => {
    return value === '****' ? '****' : value
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání konfigurace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Chyba při načítání</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchConfig}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-50 border border-green-200 rounded-md p-4 max-w-md">
            <h3 className="text-lg font-medium text-green-800 mb-2">Žádná konfigurace</h3>
            <p className="text-green-600">
              Pro projekt {projekt} nebyla nalezena žádná HWSW konfigurace.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HWSW Konfigurace</h1>
              <p className="mt-1 text-sm text-gray-600">
                IT konfigurace pro projekt: {projekt}
              </p>
            </div>
            <button
              onClick={fetchConfig}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Obnovit
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Firewall Access */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => toggleSection('fw_pristupy')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Firewall Přístupy ({config.fw_pristupy.length})</h2>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.fw_pristupy ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.fw_pristupy && (
            <div className="px-6 pb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Adresa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Firmy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popis</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.fw_pristupy.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.ip_adresa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id_firmy || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.popis || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Domain Users */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => toggleSection('dom_users')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Doménoví Uživatelé ({config.dom_users.length})</h2>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.dom_users ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.dom_users && (
            <div className="px-6 pb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doména</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uživatelské jméno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poznámka</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.dom_users.map((user, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{user.login}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.domena}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.poznamka || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => toggleSection('set_send_mail')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Nastavení Emailu ({config.set_send_mail.length})</h2>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.set_send_mail ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.set_send_mail && (
            <div className="px-6 pb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poznámka</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {config.set_send_mail.map((mail, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mail.id_firmy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{mail.ip_adresa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mail.port}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mail.login}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mail.poznamka || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* External Services */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => toggleSection('ext_sluzby')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Externí Služby ({config.ext_sluzby.length})</h2>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.ext_sluzby ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.ext_sluzby && (
            <div className="px-6 pb-4">
              <div className="space-y-4">
                {config.ext_sluzby.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{service.nazev}</h3>
                    <p className="text-sm text-gray-600 mb-2">{service.popis}</p>
                    <div className="text-sm text-gray-500 whitespace-pre-line bg-gray-50 p-2 rounded">
                      {service.poznamka}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Servers */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => toggleSection('servery')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Servery ({config.servery.length})</h2>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.servery ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.servery && (
            <div className="px-6 pb-4">
              <div className="space-y-6">
                {config.servery.map((server, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{server.nazev || `Server ${server.server_id}`}</h3>
                        <p className="text-sm text-gray-600">{server.popis}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-green-800 rounded">
                        {server.server_typ}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">IP Adresa:</span>
                        <p className="text-sm font-mono text-gray-900">{server.ip_adresa || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Maska:</span>
                        <p className="text-sm text-gray-900">{server.maska || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Brána:</span>
                        <p className="text-sm text-gray-900">{server.brana || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">DNS:</span>
                        <p className="text-sm text-gray-900">{server.dns || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">OS:</span>
                        <p className="text-sm text-gray-900">{server.os_app || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Firma:</span>
                        <p className="text-sm text-gray-900">{server.id_firmy || '-'}</p>
                      </div>
                    </div>

                    {server.sluzby && server.sluzby.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Služby ({server.sluzby.length})</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Název</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Typ účtu</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Poznámka</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {server.sluzby.map((service, sIndex) => (
                                <tr key={sIndex}>
                                  <td className="px-3 py-2 text-sm text-gray-900">{service.nazev}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500">{service.typ}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500">{service.login}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500">{service.typ_uctu}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500">{service.poznamka || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HwswConfigPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HwswConfigContent />
    </Suspense>
  )
}

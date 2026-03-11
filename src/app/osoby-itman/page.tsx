'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Contact } from '@/types/contact'
import { logger } from '@/lib/logger'

export default function OsobyItmanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/contacts')
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Nepodařilo se načíst kontakty'
      logger.error('Error fetching contacts:', e)
      setError(msg)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') fetchContacts()
  }, [status])

  const uniqueRoles = Array.from(
    new Set(contacts.flatMap((c) => (c.role ? c.role.split(',').map((r) => r.trim()) : [])))
  ).filter(Boolean).sort()

  const filteredContacts = contacts.filter((c) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !search ||
      (c.jmeno && c.jmeno.toLowerCase().includes(search)) ||
      (c.prijmeni && c.prijmeni.toLowerCase().includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search)) ||
      (c.role && c.role.toLowerCase().includes(search))
    const matchesRole =
      !filterRole || (c.role && c.role.split(',').map((r) => r.trim()).includes(filterRole))
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Načítání osob...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-bold text-white mb-2">Chyba při načítání</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchContacts}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <div className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                Osoby ITMAN
              </h1>
              <p className="text-sm text-gray-400 mt-1 leading-snug">
                Seznam aktuálně platných osob ITMAN
              </p>
            </div>
            <button
              type="button"
              onClick={fetchContacts}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Obnovit
            </button>
          </div>
        </div>

        <div className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0 md:max-w-2xl">
              <div>
                <label htmlFor="osoby-search" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Hledat
                </label>
                <input
                  id="osoby-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Jméno, příjmení, email, role…"
                  className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                />
              </div>
              <div>
                <label htmlFor="osoby-role" className="block text-xs font-medium text-gray-400 mb-0.5">
                  Role
                </label>
                <select
                  id="osoby-role"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                >
                  <option value="">Všechny role</option>
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 shrink-0 sm:text-right">
              Zobrazeno <span className="font-medium text-gray-300 tabular-nums">{filteredContacts.length}</span> z{' '}
              <span className="font-medium text-gray-300 tabular-nums">{contacts.length}</span>
            </p>
          </div>
        </div>

        <div className="card-professional rounded-lg border border-gray-700/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/60 bg-gray-800/40">
            <h2 className="text-lg font-medium text-white">
              Seznam osob ({filteredContacts.length})
            </h2>
          </div>
          <div className="p-6">
            {filteredContacts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Žádné osoby nevyhovují filtrům.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContacts.map((c, idx) => (
                  <div
                    key={`${c.jmeno}-${c.prijmeni}-${idx}`}
                    className="card-professional p-4 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 mb-3 flex-shrink-0">
                      {c.foto_data ? (
                        <img
                          src={`data:image/jpeg;base64,${c.foto_data}`}
                          alt={`${c.jmeno} ${c.prijmeni}`}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: '50% 15%' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-medium">
                          {(c.jmeno?.[0] || '') + (c.prijmeni?.[0] || '')}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {c.jmeno} {c.prijmeni}
                    </h3>
                    {c.role && (
                      <p className="text-sm text-gray-400 mt-1 flex flex-wrap justify-center gap-1">
                        {c.role.split(',').map((r) => (
                          <span key={r.trim()} className="bg-gray-700/80 px-2 py-0.5 rounded text-gray-300">
                            {r.trim()}
                          </span>
                        ))}
                      </p>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-sm text-green-400 hover:text-green-300 mt-2 break-all"
                      >
                        {c.email}
                      </a>
                    )}
                    {c.telefon && (
                      <a
                        href={`tel:${c.telefon.replace(/\s/g, '')}`}
                        className="text-sm text-gray-300 mt-1"
                      >
                        {c.telefon}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

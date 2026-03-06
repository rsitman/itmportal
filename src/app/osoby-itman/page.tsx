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
      <div className="w-full py-10 bg-transparent flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Načítání osob...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center min-h-[300px]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-bold text-white mb-2">Chyba při načítání</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchContacts}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="card-professional shadow-sm border-b border-gray-700/50">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Osoby ITMAN</h1>
              <p className="text-gray-300 mt-1">Seznam aktuálně platných osob ITMAN</p>
            </div>
            <button
              onClick={fetchContacts}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Obnovit
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="card-professional p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Hledat</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Jméno, příjmení, email, role..."
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
        </div>

        <div className="card-professional rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
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
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-medium">
                          {(c.jmeno?.[0] || '') + (c.prijmeni?.[0] || '')}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">
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

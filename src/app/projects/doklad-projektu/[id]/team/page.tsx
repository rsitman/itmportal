'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProjectPerson, ProjectRole, PersonType } from '@/types/project'
import { logger } from '@/lib/logger'

export default function ProjectTeamPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<ProjectPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const dokladProjektu = params.id as string

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`/api/projects/${dokladProjektu}/team`)
        
        if (response.ok) {
          const data = await response.json()
          setTeam(data.team || [])
        } else {
          logger.error('Failed to fetch team data')
        }
      } catch (error) {
        logger.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [dokladProjektu])

  const filteredTeam = team.filter(person => {
    const matchesSearch = 
      person.jmeno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.prijmeni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.nazev_role.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !filterRole || person.kod_role === filterRole
    const matchesType = !filterType || person.typ_osoby.toString() === filterType

    return matchesSearch && matchesRole && matchesType
  })

  const getPersonTypeLabel = (type: number): string => {
    const labels: Record<number, string> = {
      [PersonType.INTERNAL]: 'Vlastní osoba',
      [PersonType.EXTERNAL]: 'Externí dodavatel',
      [PersonType.CUSTOMER]: 'Zákazník'
    }
    return labels[type] || 'Neznámý typ'
  }

  const getPersonTypeColor = (type: number): string => {
    const colors: Record<number, string> = {
      [PersonType.INTERNAL]: 'bg-blue-100 text-green-800',
      [PersonType.EXTERNAL]: 'bg-orange-100 text-orange-800',
      [PersonType.CUSTOMER]: 'bg-green-100 text-green-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      'ZAK_INV': 'bg-purple-100 text-purple-800',
      'ITMAN': 'bg-red-100 text-red-800',
      'DEV': 'bg-blue-100 text-green-800',
      'KON': 'bg-yellow-100 text-yellow-800',
      'TEST': 'bg-gray-100 text-gray-800',
      'SUP': 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const exportToExcel = () => {
    const csvContent = [
      ['Jméno', 'Příjmení', 'Email', 'Telefon', 'Role', 'Typ osoby'],
      ...filteredTeam.map(person => [
        person.jmeno,
        person.prijmeni,
        person.email || '',
        person.telefon || '',
        person.nazev_role,
        getPersonTypeLabel(person.typ_osoby)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `tym-${dokladProjektu}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tým projektu: {dokladProjektu}
            </h1>
            <p className="text-gray-600 mt-1">
              Správa členů týmu a jejich rolí v projektu
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            ← Zpět na projekty
          </button>
        </div>
      </div>

      {/* Filtry */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hledat osobu
            </label>
            <input
              type="text"
              placeholder="Jméno, příjmení, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny role</option>
              <option value="ZAK_INV">Objednatel</option>
              <option value="ITMAN">IT Manažer</option>
              <option value="DEV">Vývojář</option>
              <option value="KON">Konzultant</option>
              <option value="TEST">Tester</option>
              <option value="SUP">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ osoby
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny typy</option>
              <option value="0">Vlastní osoba</option>
              <option value="10">Externí dodavatel</option>
              <option value="20">Zákazník</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              📊 Export do Excelu
            </button>
          </div>
        </div>
      </div>

      {/* Statistiky */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{team.length}</div>
          <div className="text-sm text-gray-600">Celkem členů</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {team.filter(p => p.typ_osoby === PersonType.INTERNAL).length}
          </div>
          <div className="text-sm text-gray-600">Vlastní osoby</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {team.filter(p => p.typ_osoby === PersonType.EXTERNAL).length}
          </div>
          <div className="text-sm text-gray-600">Externí dodavatelé</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {team.filter(p => p.typ_osoby === PersonType.CUSTOMER).length}
          </div>
          <div className="text-sm text-gray-600">Zákazníci</div>
        </div>
      </div>

      {/* Tabulka týmu */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jméno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Příjmení
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ osoby
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeam.map((person, index) => (
                <tr key={`${person.kod_role}-${person.jmeno}-${person.prijmeni}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {person.jmeno}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.prijmeni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.email ? (
                      <a href={`mailto:${person.email}`} className="text-green-600 hover:text-green-800">
                        {person.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {person.telefon ? (
                      <a href={`tel:${person.telefon}`} className="text-green-600 hover:text-green-800">
                        {person.telefon}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(person.kod_role)}`}>
                      {person.nazev_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPersonTypeColor(person.typ_osoby)}`}>
                      {getPersonTypeLabel(person.typ_osoby)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTeam.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {searchTerm || filterRole || filterType
              ? 'Nebyly nalezeny žádné osoby odpovídající filtrům.'
              : 'Tento projekt nemá žádné přiřazené osoby.'}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExternalComponent } from '@/types/project'
import { logger } from '@/lib/logger'

export default function ExternalComponentsPage() {
  const params = useParams()
  const router = useRouter()
  const [components, setComponents] = useState<ExternalComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSupplier, setFilterSupplier] = useState<string>('')
  const [filterForm, setFilterForm] = useState<string>('')

  const dokladProjektu = params.id as string

  useEffect(() => {
    const fetchComponentsData = async () => {
      try {
        const response = await fetch(`/api/projects/${dokladProjektu}/extcomps`)
        
        if (response.ok) {
          const data = await response.json()
          setComponents(data.components || [])
        } else {
          logger.error('Failed to fetch external components data')
        }
      } catch (error) {
        logger.error('Error fetching external components data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComponentsData()
  }, [dokladProjektu])

  const filteredComponents = components.filter(component => {
    const matchesSearch = 
      component.nazev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.kod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.dodavatel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.popis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSupplier = !filterSupplier || component.dodavatel === filterSupplier
    const matchesForm = !filterForm || component.forma_kom === filterForm

    return matchesSearch && matchesSupplier && matchesForm
  })

  const getUniqueSuppliers = () => {
    return [...new Set(components.map(c => c.dodavatel))].sort()
  }

  const getUniqueForms = () => {
    return [...new Set(components.map(c => c.forma_kom))].sort()
  }

  const exportToExcel = () => {
    const csvContent = [
      ['Kód', 'Název', 'Popis', 'Forma', 'Dodavatel', 'Jméno', 'Příjmení', 'Email', 'Telefon'],
      ...filteredComponents.map(component => [
        component.kod,
        component.nazev,
        component.popis.replace(/\n/g, ' '),
        component.forma_kom,
        component.dodavatel,
        component.jmeno,
        component.prijmeni,
        component.email || '',
        component.telefon || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `externi-komponenty-${dokladProjektu}.csv`)
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
              Externí komponenty: {dokladProjektu}
            </h1>
            <p className="text-gray-600 mt-1">
              Seznam externích softwarových komponent 3. stran
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
              Hledat komponentu
            </label>
            <input
              type="text"
              placeholder="Kód, název, dodavatel, popis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dodavatel
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všichni dodavatelé</option>
              {getUniqueSuppliers().map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma komponenty
            </label>
            <select
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všechny formy</option>
              {getUniqueForms().map(form => (
                <option key={form} value={form}>{form}</option>
              ))}
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
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{components.length}</div>
          <div className="text-sm text-gray-600">Celkem komponent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {getUniqueSuppliers().length}
          </div>
          <div className="text-sm text-gray-600">Počet dodavatelů</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {getUniqueForms().length}
          </div>
          <div className="text-sm text-gray-600">Počet forem</div>
        </div>
      </div>

      {/* Tabulka komponent */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kód
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Název
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Popis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dodavatel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontaktní osoba
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComponents.map((component, index) => (
                <tr key={`${component.kod}-${component.nazev}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {component.kod}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {component.nazev}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={component.popis}>
                      {component.popis.replace(/\n/g, ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-green-800">
                      {component.forma_kom}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {component.dodavatel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {component.jmeno} {component.prijmeni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {component.email ? (
                      <a href={`mailto:${component.email}`} className="text-green-600 hover:text-green-800">
                        {component.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {component.telefon ? (
                      <a href={`tel:${component.telefon}`} className="text-green-600 hover:text-green-800">
                        {component.telefon}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredComponents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {searchTerm || filterSupplier || filterForm
              ? 'Nebyly nalezeny žádné komponenty odpovídající filtrům.'
              : 'Tento projekt nemá žádné externí komponenty.'}
          </div>
        </div>
      )}
    </div>
  )
}

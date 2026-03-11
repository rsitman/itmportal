'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CompanyMap from './CompanyMap'

interface Company {
  id: string
  name: string
  address: string
  city: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website?: string
  employees?: number
  foundedYear?: number
  industry?: string
  description?: string
  isProject?: boolean
  isDatabase?: boolean
  projectId?: string
  jiraKey?: string
  customerName?: string
  hasValidGps?: boolean
}

interface MapData {
  companies: Company[]
  metadata: {
    totalCompanies: number
    countries: string[]
    cities: string[]
    industries: string[]
    employeeStats: {
      total: number
      average: number
      max: number
      min: number
    }
    projectCount?: number
    databaseCount?: number
  }
}

export default function CompanyMapClient() {
  const searchParams = useSearchParams()

  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/map-data')
        if (!response.ok) {
          throw new Error('Failed to fetch map data')
        }
        const mapData: MapData = await response.json()
        setData(mapData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Apply initial deep-link selection once data is loaded
  useEffect(() => {
    if (!data) return

    const projektParam = searchParams.get('projekt')
    if (!projektParam) return

    const match = data.companies.find((c) => c.id === projektParam || c.projectId === projektParam)
    if (match) {
      setSelectedProjectId(match.id)
    }
  }, [data, searchParams])

  if (loading) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Načítání dat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full py-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">Žádná data nebyla nalezena</p>
        </div>
      </div>
    )
  }
  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return data.companies.filter((company: Company) => {
      const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry
      const matchesSearch =
        term === '' ||
        company.name.toLowerCase().includes(term) ||
        company.address.toLowerCase().includes(term) ||
        company.city.toLowerCase().includes(term) ||
        (company.customerName && company.customerName.toLowerCase().includes(term))
      return matchesIndustry && matchesSearch
    })
  }, [data, selectedIndustry, searchTerm])

  const companiesWithGps = useMemo(
    () => filteredCompanies.filter((c) => c.hasValidGps),
    [filteredCompanies],
  )

  const companiesWithoutGps = useMemo(
    () => filteredCompanies.filter((c) => !c.hasValidGps),
    [filteredCompanies],
  )

  const summary = useMemo(() => {
    const total = data.companies.length
    const withGps = data.companies.filter((c) => c.hasValidGps).length
    const withoutGps = total - withGps
    const customers = Array.from(
      new Set(
        data.companies
          .filter((c) => c.isProject && c.customerName)
          .map((c) => c.customerName as string),
      ),
    )

    return {
      total,
      withGps,
      withoutGps,
      customersCount: customers.length,
    }
  }, [data])

  const selectedCompany = useMemo(
    () => (selectedProjectId ? data.companies.find((c) => c.id === selectedProjectId) ?? null : null),
    [data, selectedProjectId],
  )

  const handleMarkerClick = (companyId: string) => {
    setSelectedProjectId(companyId)
  }

  const handleListItemClick = (company: Company) => {
    setSelectedProjectId(company.id)
  }

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-6 space-y-6">
        {/* Header */}
        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                Mapa projektů
              </h1>
              <p className="mt-1 text-sm text-gray-400 leading-snug">
                Geografické rozmístění servisních projektů a zákazníků.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:gap-6 sm:text-right shrink-0">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Projekty celkem
                </dt>
                <dd className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                  {summary.total}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  S GPS
                </dt>
                <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                  {summary.withGps}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Bez GPS
                </dt>
                <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                  {summary.withoutGps}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Zákazníků
                </dt>
                <dd className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                  {summary.customersCount}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Filters */}
        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 w-full min-w-0">
              <div className="w-full min-w-0 sm:max-w-md">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Hledat projekt / zákazníka
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Název projektu, firma, město…"
                  className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                />
              </div>
              <div className="w-full sm:w-64">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Odvětví
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                >
                  <option value="all">Všechna odvětví</option>
                  {data.metadata.industries.map((industry: string) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-500 sm:text-right shrink-0">
              Zobrazeno{' '}
              <span className="font-medium text-gray-300">{filteredCompanies.length}</span> z{' '}
              <span className="font-medium text-gray-300">{data.companies.length}</span>
            </div>
          </div>
        </div>

        {/* Main split: map + side panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] gap-4 items-start">
          {/* Map */}
          <div className="card-professional rounded-lg border border-gray-700/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/40 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Mapa projektů</h2>
            </div>
            <div className="h-[520px] md:h-[600px]">
              <CompanyMap
                companies={companiesWithGps}
                height="100%"
                showControls={true}
                className="h-full"
                selectedProjectId={selectedProjectId}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="card-professional rounded-lg border border-gray-700/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/40">
                <h2 className="text-sm font-semibold text-white">
                  Projekty na mapě ({companiesWithGps.length})
                </h2>
              </div>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-700/70 bg-gray-900/40">
                {companiesWithGps.map((company) => {
                  const isSelected = company.id === selectedProjectId
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleListItemClick(company)}
                      className={`w-full text-left px-4 py-3 transition-colors border-l-[3px] ${
                        isSelected
                          ? 'bg-gray-800/80 border-l-green-500/70'
                          : 'bg-transparent border-l-transparent hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {company.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {company.customerName || company.address}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                            {company.isProject && (
                              <span className="inline-flex items-center rounded-md border border-gray-600/60 bg-gray-800/80 px-2 py-0.5 text-[11px] font-medium text-gray-200 leading-snug">
                                🗂️ Projekt
                              </span>
                            )}
                            {company.jiraKey && (
                              <span className="text-[11px] text-gray-400">
                                🔑 {company.jiraKey}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                          {company.latitude.toFixed(3)}, {company.longitude.toFixed(3)}
                        </div>
                      </div>
                    </button>
                  )
                })}
                {companiesWithGps.length === 0 && (
                  <div className="px-4 py-4 text-sm text-gray-400">
                    Žádné projekty s GPS neodpovídají aktuálním filtrům.
                  </div>
                )}
              </div>
            </div>

            {/* Detail selected project */}
            <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
              {selectedCompany ? (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {selectedCompany.name}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedCompany.customerName || selectedCompany.address}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {selectedCompany.projectId || selectedCompany.id}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Lokace
                      </div>
                      <div className="text-gray-200 mt-0.5">
                        {selectedCompany.city || '—'}
                        {selectedCompany.country ? `, ${selectedCompany.country}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        GPS
                      </div>
                      <div className="text-gray-200 mt-0.5 tabular-nums">
                        {selectedCompany.latitude.toFixed(5)}, {selectedCompany.longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700/60 pt-3 mt-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">
                      Akce
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Akční chipy – anchor + vnořený span pattern */}
                      {selectedCompany.projectId && (
                        <a
                          href={`/projects/doklad-projektu/${encodeURIComponent(
                            selectedCompany.projectId,
                          )}`}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300">Doklad projektu</span>
                        </a>
                      )}
                      {selectedCompany.projectId && (
                        <a
                          href={`/plan_patchovani?q=${encodeURIComponent(
                            selectedCompany.customerName || '',
                          )}`}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300">Patchování</span>
                        </a>
                      )}
                      {selectedCompany.projectId && (
                        <a
                          href={`/upgrades?projekt=${encodeURIComponent(
                            selectedCompany.projectId,
                          )}`}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300">Upgrady</span>
                        </a>
                      )}
                      {selectedCompany.projectId && (
                        <a
                          href={`/databases?projekt=${encodeURIComponent(
                            selectedCompany.projectId,
                          )}`}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300">Stav DB</span>
                        </a>
                      )}
                      {selectedCompany.projectId && (
                        <a
                          href={`/hwsw-config?projekt=${encodeURIComponent(
                            selectedCompany.projectId,
                          )}`}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transform transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                          <span className="text-gray-300">HW/SW konfigurace</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Vyberte projekt ze seznamu nebo klikněte na marker v mapě pro zobrazení detailu.
                </div>
              )}
            </div>

            {/* Projects without GPS */}
            {companiesWithoutGps.length > 0 && (
              <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
                <h2 className="text-sm font-semibold text-white mb-2">
                  Projekty bez GPS ({companiesWithoutGps.length})
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  Tyto projekty nemají platné GPS souřadnice a nejsou zobrazeny na mapě.
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {companiesWithoutGps.map((company) => (
                    <div key={company.id} className="text-xs text-gray-300">
                      <span className="font-medium">{company.name}</span>
                      {company.customerName && (
                        <span className="text-gray-500"> · {company.customerName}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

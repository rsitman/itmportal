'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProjectPerson, PersonType } from '@/types/project'
import { logger } from '@/lib/logger'

type TymPageProps = {
  dokladProjektu: string
}

export default function TymPage({ dokladProjektu }: TymPageProps) {
  const [team, setTeam] = useState<ProjectPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchTeam = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/projects/${encodeURIComponent(dokladProjektu)}/team`)

        if (!response.ok) {
          const message = `Nepodařilo se načíst tým (HTTP ${response.status})`
          logger.error('Error fetching project team:', message)
          if (isMounted) {
            setError(message)
          }
          return
        }

        const data = await response.json()
        const teamData: ProjectPerson[] = Array.isArray(data.team) ? data.team : []

        if (isMounted) {
          setTeam(teamData)
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Došlo k chybě při načítání dat o týmu projektu'
        logger.error('Error fetching project team:', e)
        if (isMounted) {
          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTeam()

    return () => {
      isMounted = false
    }
  }, [dokladProjektu])

  const filteredTeam = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return team
    }

    return team.filter((person) => {
      const haystacks = [
        person.jmeno,
        person.prijmeni,
        person.email ?? '',
        person.nazev_role,
      ]

      return haystacks.some((value) =>
        value ? value.toString().toLowerCase().includes(query) : false,
      )
    })
  }, [team, searchTerm])

  const totalCount = team.length
  const internalCount = team.filter((p) => p.typ_osoby === PersonType.INTERNAL).length
  const externalCount = team.filter((p) => p.typ_osoby === PersonType.EXTERNAL).length
  const customerCount = team.filter((p) => p.typ_osoby === PersonType.CUSTOMER).length

  const showSkeleton = loading && team.length === 0

  return (
    <div className="w-full py-10 bg-transparent">
      <div className="px-6 space-y-6">
        <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
          <HlavickaTymu
            dokladProjektu={dokladProjektu}
            totalCount={totalCount}
            internalCount={internalCount}
            externalCount={externalCount}
            customerCount={customerCount}
          />

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
              <div className="w-full sm:max-w-md">
                <label
                  htmlFor="team-search"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Hledat v týmu
                </label>
                <input
                  id="team-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Jméno, příjmení, email nebo role…"
                  className="w-full pl-3.5 pr-3.5 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:border-green-500/50"
                />
              </div>
              <div className="text-xs text-gray-500 sm:text-right sm:pb-0.5">
                Zobrazeno <span className="font-medium text-gray-300">{filteredTeam.length}</span> z{' '}
                <span className="font-medium text-gray-300">{totalCount}</span> členů
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-700/70 bg-red-900/40 px-5 py-4 text-base text-red-100">
                <div className="font-semibold mb-1">Chyba při načítání týmu</div>
                <div className="text-red-100/90 leading-snug">{error}</div>
              </div>
            )}

            <SeznamClenu
              loading={showSkeleton}
              team={filteredTeam}
              hasAny={team.length > 0}
              hasFilters={Boolean(searchTerm.trim())}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type HlavickaTymuProps = {
  dokladProjektu: string
  totalCount: number
  internalCount: number
  externalCount: number
  customerCount: number
}

function HlavickaTymu({
  dokladProjektu,
  totalCount,
  internalCount,
  externalCount,
  customerCount,
}: HlavickaTymuProps) {
  return (
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Tým projektu{' '}
            <span className="font-mono text-sm text-gray-500 align-middle">{dokladProjektu}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            Přehled členů týmu, jejich rolí a kontaktních informací pro daný projekt.
          </p>
        </div>
        <dl className="grid grid-cols-4 gap-x-4 gap-y-0.5 text-xs sm:flex sm:gap-6 sm:text-right">
          <div>
            <dt className="text-gray-500">Celkem</dt>
            <dd className="font-medium text-gray-300">{totalCount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Vlastní</dt>
            <dd className="font-medium text-gray-400">{internalCount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Externí</dt>
            <dd className="font-medium text-gray-400">{externalCount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Zákazníci</dt>
            <dd className="font-medium text-gray-400">{customerCount}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

type SeznamClenuProps = {
  loading: boolean
  team: ProjectPerson[]
  hasAny: boolean
  hasFilters: boolean
}

function SeznamClenu({ loading, team, hasAny, hasFilters }: SeznamClenuProps) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-14 rounded-lg bg-gray-800/60 border border-gray-700/60 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!team.length) {
    return (
      <div className="mt-3 rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-6 text-center">
        <p className="text-base text-gray-400 leading-snug">
          {hasAny && hasFilters
            ? 'Nebyly nalezeny žádné osoby odpovídající zadanému vyhledávání.'
            : 'Tento projekt aktuálně nemá žádné přiřazené osoby.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="hidden lg:grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)_minmax(0,1.15fr)] gap-3 px-1 pb-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
        <div>Člen týmu</div>
        <div>Role a typ</div>
        <div className="text-right pr-0.5">Kontakt</div>
      </div>
      <ul className="space-y-2 mt-0.5" role="list">
        {team.map((person, index) => (
          <li
            key={`${person.kod_role}-${person.jmeno}-${person.prijmeni}-${index}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 md:px-5 py-2.5 shadow-sm transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-500/70 hover:shadow-md hover:-translate-y-0.5"
          >
            <RadekClena person={person} />
          </li>
        ))}
      </ul>
    </div>
  )
}

type RadekClenaProps = {
  person: ProjectPerson
}

function RadekClena({ person }: RadekClenaProps) {
  return (
    <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)_minmax(0,1.15fr)] lg:items-center lg:gap-3">
      {/* Zóna 1: identita */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-gray-200">
          {getInitials(person.jmeno, person.prijmeni)}
        </div>
        <div className="flex flex-col gap-px min-w-0">
          <div className="text-[15px] font-semibold text-white leading-snug truncate">
            {person.jmeno} {person.prijmeni}
          </div>
          <div className="text-xs text-gray-400 leading-snug">
            {getPersonTypeLabel(person.typ_osoby)} · {person.nazev_role}
          </div>
        </div>
      </div>
      {/* Zóna 2: role a typ */}
      <div className="flex flex-wrap gap-1.5 lg:justify-start lg:items-center">
        <RoleClena kodRole={person.kod_role} nazevRole={person.nazev_role} />
        <StavovyBadge typOsoby={person.typ_osoby} />
      </div>
      {/* Zóna 3: kontakt */}
      <div className="lg:text-right lg:leading-tight">
        <KontaktClena email={person.email} telefon={person.telefon} />
      </div>
    </div>
  )
}

type RoleClenaProps = {
  kodRole: string
  nazevRole: string
}

function RoleClena({ kodRole, nazevRole }: RoleClenaProps) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-700/50 bg-gray-800/60 px-2 py-0.5 text-[11px] font-medium text-gray-400 leading-snug">
      <span className="mr-1 text-[10px] font-mono uppercase text-gray-500">{kodRole}</span>
      <span>{nazevRole}</span>
    </span>
  )
}

type KontaktClenaProps = {
  email?: string
  telefon?: string
}

function KontaktClena({ email, telefon }: KontaktClenaProps) {
  return (
    <div className="flex flex-col items-start gap-1 text-xs lg:items-end lg:leading-snug">
      {email ? (
        <a
          href={`mailto:${email}`}
          className="text-green-500/90 hover:text-green-400 break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          {email}
        </a>
      ) : (
        <span className="text-gray-500">—</span>
      )}
      {telefon ? (
        <a
          href={`tel:${telefon}`}
          className="text-gray-400 hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          {telefon}
        </a>
      ) : (
        <span className="text-gray-500">—</span>
      )}
    </div>
  )
}

type StavovyBadgeProps = {
  typOsoby: number
}

function StavovyBadge({ typOsoby }: StavovyBadgeProps) {
  const label = getPersonTypeLabel(typOsoby)

  return (
    <span className="inline-flex items-center rounded-md border border-gray-700/50 bg-gray-900/50 px-2 py-0.5 text-[11px] font-medium text-gray-400 leading-snug">
      {label}
    </span>
  )
}

function getInitials(jmeno: string, prijmeni: string): string {
  const first = jmeno?.[0] ?? ''
  const last = prijmeni?.[0] ?? ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || '?'
}

function getPersonTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    [PersonType.INTERNAL]: 'Vlastní osoba',
    [PersonType.EXTERNAL]: 'Externí dodavatel',
    [PersonType.CUSTOMER]: 'Zákazník',
  }
  return labels[type] ?? 'Neznámý typ'
}


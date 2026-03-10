`use client`

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
        <div className="card-professional rounded-lg border border-gray-700/60 p-6">
          <HlavickaTymu
            dokladProjektu={dokladProjektu}
            totalCount={totalCount}
            internalCount={internalCount}
            externalCount={externalCount}
            customerCount={customerCount}
          />

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="w-full md:max-w-md">
                <label
                  htmlFor="team-search"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5"
                >
                  Hledat v týmu
                </label>
                <input
                  id="team-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Jméno, příjmení, email nebo role…"
                  className="w-full pl-4 pr-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-600/60 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
              </div>
              <div className="text-xs text-gray-400 md:text-right">
                Zobrazeno{' '}
                <span className="font-semibold text-white">{filteredTeam.length}</span> z{' '}
                <span className="font-semibold text-white">{totalCount}</span> členů
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-700/70 bg-red-900/40 px-4 py-3 text-sm text-red-100">
                <div className="font-semibold mb-1">Chyba při načítání týmu</div>
                <div className="text-red-100/90">{error}</div>
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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Tým projektu{' '}
          <span className="font-mono text-sm align-middle text-gray-300">{dokladProjektu}</span>
        </h1>
        <p className="text-sm text-gray-400">
          Přehled členů týmu, jejich rolí a kontaktních informací pro daný projekt.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs text-gray-300 sm:text-right sm:min-w-[220px]">
        <div>
          <dt className="text-gray-400">Celkem členů</dt>
          <dd className="font-semibold text-white">{totalCount}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Vlastní osoby</dt>
          <dd className="font-semibold text-gray-100">{internalCount}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Externí dodavatelé</dt>
          <dd className="font-semibold text-gray-100">{externalCount}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Zákazníci</dt>
          <dd className="font-semibold text-gray-100">{customerCount}</dd>
        </div>
      </dl>
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
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 rounded-lg bg-gray-800/60 border border-gray-700/60 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!team.length) {
    return (
      <div className="mt-4 rounded-lg border border-gray-700/60 bg-gray-900/40 px-4 py-6 text-sm text-gray-400 text-center">
        {hasAny && hasFilters
          ? 'Nebyly nalezeny žádné osoby odpovídající zadanému vyhledávání.'
          : 'Tento projekt aktuálně nemá žádné přiřazené osoby.'}
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="hidden md:grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)] gap-4 px-1 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div>Člen týmu</div>
        <div className="text-right pr-2">Role a kontakty</div>
      </div>
      <ul className="space-y-2" role="list">
        {team.map((person, index) => (
          <li
            key={`${person.kod_role}-${person.jmeno}-${person.prijmeni}-${index}`}
            className="rounded-lg border border-gray-700/70 bg-gray-900/40 px-4 md:px-6 py-3.5 shadow-sm transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-500/70 hover:shadow-md"
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
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)] md:items-start md:gap-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-gray-100">
          {getInitials(person.jmeno, person.prijmeni)}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold text-white">
            {person.jmeno} {person.prijmeni}
          </div>
          <div className="text-xs text-gray-400">
            {getPersonTypeLabel(person.typ_osoby)} · {person.nazev_role}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          <RoleClena kodRole={person.kod_role} nazevRole={person.nazev_role} />
          <StavovyBadge typOsoby={person.typ_osoby} />
        </div>
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
    <span className="inline-flex items-center rounded-full border border-gray-600/70 bg-gray-800/80 px-2.5 py-0.5 text-xs font-medium text-gray-100">
      <span className="mr-1.5 text-[10px] font-mono uppercase text-gray-400">{kodRole}</span>
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
    <div className="flex flex-col items-start gap-1 text-xs text-gray-300 md:items-end">
      {email ? (
        <a href={`mailto:${email}`} className="text-green-400 hover:text-green-300">
          {email}
        </a>
      ) : (
        <span className="text-gray-500">Email není uveden</span>
      )}
      {telefon ? (
        <a href={`tel:${telefon}`} className="text-gray-300 hover:text-gray-100">
          {telefon}
        </a>
      ) : (
        <span className="text-gray-500">Telefon není uveden</span>
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
    <span className="inline-flex items-center rounded-full border border-gray-600/70 bg-gray-900/60 px-2.5 py-0.5 text-[11px] font-medium text-gray-200">
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


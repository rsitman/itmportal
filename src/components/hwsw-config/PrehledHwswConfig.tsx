import type { ReactNode } from 'react'
import { HwswConfig, HwZarizeni, Server } from '@/types/hwsw-config'

type PrehledHwswConfigProps = {
  projekt: string
  config: HwswConfig
}

type SekceKind =
  | 'servery'
  | 'hw-zarizeni'
  | 'fw-pristupy'
  | 'domenovi-uzivatele'
  | 'nastaveni-emailu'
  | 'externi-sluzby'

type SekceDef = {
  id: SekceKind
  heading: string
  shouldRender: boolean
  defaultOpen?: boolean
  count?: number
}

function asString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function humanLabelFromKey(key: string): string {
  const map: Record<string, string> = {
    ip_adresa: 'IP adresa',
    id_firmy: 'Firma',
    popis: 'Popis',
    nazev: 'Název',
    server_typ: 'Typ serveru',
    maska: 'Maska',
    brana: 'Brána',
    dns: 'DNS',
    os_app: 'OS',
    os_lic: 'OS licence',
    poznamka: 'Poznámka',
    login: 'Login',
    domena: 'Doména',
    username: 'Uživatelské jméno',
    port: 'Port',
  }
  return map[key] ?? key.replaceAll('_', ' ')
}

function pickDeviceTitle(device: HwZarizeni, fallbackIndex: number): string {
  const candidates = [
    device.nazev,
    device.name,
    device.typ,
    device.model,
    device.serial,
    device.id,
  ]
  for (const c of candidates) {
    const s = asString(c)
    if (s) return s
  }
  return `Zařízení #${fallbackIndex + 1}`
}

function primitiveEntries(
  obj: Record<string, unknown>,
): Array<{ key: string; value: string }> {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value == null) return { key, value: '' }
      if (typeof value === 'string') return { key, value: value }
      if (typeof value === 'number' || typeof value === 'boolean')
        return { key, value: String(value) }
      return { key, value: '' }
    })
    .filter((e) => isNonEmptyString(e.value))
}

function defaultOpenSecondary(count: number, { smallOpen }: { smallOpen: boolean }): boolean {
  if (count <= 0) return false
  return smallOpen ? count <= 6 : count <= 3
}

export default function PrehledHwswConfig({ projekt, config }: PrehledHwswConfigProps) {
  const hwSekceExists = Object.prototype.hasOwnProperty.call(config, 'hw_zarizeni')
  const hwCount = Array.isArray(config.hw_zarizeni) ? config.hw_zarizeni.length : 0

  const sections: SekceDef[] = [
    {
      id: 'servery',
      heading: 'Servery',
      shouldRender: true,
      defaultOpen: true,
      count: config.servery.length,
    },
    {
      id: 'hw-zarizeni',
      heading: 'HW zařízení',
      shouldRender: hwSekceExists,
      defaultOpen: hwCount > 0,
      count: hwCount,
    },
    {
      id: 'fw-pristupy',
      heading: 'Firewall přístupy',
      shouldRender: true,
      defaultOpen: defaultOpenSecondary(config.fw_pristupy.length, { smallOpen: true }),
      count: config.fw_pristupy.length,
    },
    {
      id: 'domenovi-uzivatele',
      heading: 'Doménoví uživatelé',
      shouldRender: true,
      defaultOpen: defaultOpenSecondary(config.dom_users.length, { smallOpen: false }),
      count: config.dom_users.length,
    },
    {
      id: 'nastaveni-emailu',
      heading: 'Nastavení emailu',
      shouldRender: true,
      defaultOpen: defaultOpenSecondary(config.set_send_mail.length, { smallOpen: false }),
      count: config.set_send_mail.length,
    },
    {
      id: 'externi-sluzby',
      heading: 'Externí služby',
      shouldRender: true,
      defaultOpen: defaultOpenSecondary(config.ext_sluzby.length, { smallOpen: true }),
      count: config.ext_sluzby.length,
    },
  ]

  const tocSections = sections.filter((s) => s.shouldRender)

  return (
    <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <HlavickaHwswConfig projekt={projekt} sections={sections} />

      <div className="mt-4 flex flex-col gap-4">
        <TocPanel sections={tocSections} />

        <div className="space-y-6">
          {sections.map((sec) => {
            if (!sec.shouldRender) return null
            if (sec.id === 'servery') {
              return (
                <Sekce id={sec.id} key={sec.id} heading={sec.heading}>
                  <SekceServery servery={config.servery} />
                </Sekce>
              )
            }
            if (sec.id === 'hw-zarizeni') {
              return (
                <SekceCollapsible
                  id={sec.id}
                  key={sec.id}
                  heading={sec.heading}
                  defaultOpen={Boolean(sec.defaultOpen)}
                >
                  <SekceHwZarizeni devices={config.hw_zarizeni} />
                </SekceCollapsible>
              )
            }
            if (sec.id === 'fw-pristupy') {
              return (
                <SekceCollapsible
                  id={sec.id}
                  key={sec.id}
                  heading={sec.heading}
                  defaultOpen={Boolean(sec.defaultOpen)}
                >
                  <SekceFirewall config={config} />
                </SekceCollapsible>
              )
            }
            if (sec.id === 'domenovi-uzivatele') {
              return (
                <SekceCollapsible
                  id={sec.id}
                  key={sec.id}
                  heading={sec.heading}
                  defaultOpen={Boolean(sec.defaultOpen)}
                >
                  <SekceDomenoviUzivatele config={config} />
                </SekceCollapsible>
              )
            }
            if (sec.id === 'nastaveni-emailu') {
              return (
                <SekceCollapsible
                  id={sec.id}
                  key={sec.id}
                  heading={sec.heading}
                  defaultOpen={Boolean(sec.defaultOpen)}
                >
                  <SekceEmail config={config} />
                </SekceCollapsible>
              )
            }
            if (sec.id === 'externi-sluzby') {
              return (
                <SekceCollapsible
                  id={sec.id}
                  key={sec.id}
                  heading={sec.heading}
                  defaultOpen={Boolean(sec.defaultOpen)}
                >
                  <SekceExterniSluzby config={config} />
                </SekceCollapsible>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}

function HlavickaHwswConfig({ projekt, sections }: { projekt: string; sections: SekceDef[] }) {
  const byId = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<SekceKind, SekceDef>
  const hwSekceExists = Boolean(byId['hw-zarizeni']?.shouldRender)

  return (
    <header className="border-b border-gray-700/50 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            HW/SW konfigurace
          </h1>
          <p className="mt-1 text-sm text-gray-400 leading-snug">
            IT konfigurace pro projekt:{' '}
            <span className="font-mono text-[12px] text-gray-300">{projekt}</span>
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-x-6 gap-y-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-8 sm:gap-y-2 sm:text-right shrink-0">
          <Stat label="Servery" value={byId.servery?.count ?? 0} />
          {hwSekceExists ? <Stat label="HW zařízení" value={byId['hw-zarizeni']?.count ?? 0} /> : null}
          <Stat label="FW" value={byId['fw-pristupy']?.count ?? 0} />
          <Stat label="Uživatelé" value={byId['domenovi-uzivatele']?.count ?? 0} />
          <Stat label="Email" value={byId['nastaveni-emailu']?.count ?? 0} />
          <Stat label="Externí" value={byId['externi-sluzby']?.count ?? 0} />
        </dl>
      </div>
    </header>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="sm:min-w-[4.75rem]">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="text-base font-semibold text-gray-200 mt-0.5 tabular-nums">{value}</dd>
    </div>
  )
}

function TocPanel({ sections }: { sections: Array<Pick<SekceDef, 'id' | 'heading'>> }) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Obsah</div>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/60 hover:border-gray-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 transition-colors"
            >
              <span className="text-gray-300">{s.heading}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function Sekce({
  id,
  heading,
  children,
}: {
  id: SekceKind
  heading: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{heading}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function SekceCollapsible({
  id,
  heading,
  defaultOpen,
  children,
}: {
  id: SekceKind
  heading: string
  defaultOpen: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <details
        open={defaultOpen}
        className="rounded-lg border border-gray-700/60 bg-gray-900/25"
      >
        <summary className="cursor-pointer list-none px-4 py-3 md:px-5 md:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{heading}</h2>
            <span className="text-[11px] text-gray-500">zobrazit / skrýt</span>
          </div>
        </summary>
        <div className="px-4 pb-4 md:px-5 md:pb-5">{children}</div>
      </details>
    </section>
  )
}

function SekceServery({ servery }: { servery: Server[] }) {
  if (!servery.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5 text-sm text-gray-400">
        Žádné servery k zobrazení.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {servery.map((server, idx) => (
        <div
          key={`${server.server_id}-${idx}`}
          className="rounded-lg border border-gray-700/60 bg-gray-900/35 px-4 py-4 md:px-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-base font-semibold text-white leading-tight">
                {server.nazev || `Server ${server.server_id}`}
              </div>
              {server.popis ? (
                <div className="mt-0.5 text-sm text-gray-400 leading-snug">{server.popis}</div>
              ) : null}
            </div>
            {server.server_typ ? (
              <span className="inline-flex items-center rounded-md border border-blue-700/40 bg-blue-900/25 px-2 py-0.5 text-[11px] font-medium leading-snug">
                <span className="text-blue-200/90">{server.server_typ}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <Kv label="IP adresa" value={server.ip_adresa} mono />
            <Kv label="Maska" value={server.maska} />
            <Kv label="Brána" value={server.brana} />
            <Kv label="DNS" value={server.dns} />
            <Kv label="OS" value={server.os_app} />
            <Kv label="Firma" value={server.id_firmy} />
          </div>

          {server.sluzby?.length ? (
            <div className="mt-4">
              <div className="text-sm font-semibold text-white mb-2">
                Služby <span className="text-gray-500 font-normal">({server.sluzby.length})</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/50">
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Název
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Typ
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Login
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Typ účtu
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Verze
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 min-w-[260px]">
                        Poznámka
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/70">
                    {server.sluzby.map((s, sIdx) => (
                      <tr key={`${s.kod}-${sIdx}`} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 align-top text-sm text-gray-200">
                          {s.nazev || '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-gray-300">{s.typ || '—'}</td>
                        <td className="px-4 py-3 align-top text-sm text-gray-300">
                          <span className="font-mono text-[11px] text-gray-300">{s.login || '—'}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-gray-300">{s.typ_uctu || '—'}</td>
                        <td className="px-4 py-3 align-top text-sm text-gray-300">
                          <span className="font-mono text-[11px] text-gray-300">{s.verze || '—'}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-gray-300">
                          {s.poznamka ? (
                            <div className="text-xs text-gray-300 whitespace-pre-line leading-snug">
                              {s.poznamka}
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Kv({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={mono ? 'mt-0.5 font-mono text-[12px] text-gray-200 break-all' : 'mt-0.5 text-sm text-gray-200 break-words'}>
        {value?.trim() ? value : <span className="text-gray-500">—</span>}
      </div>
    </div>
  )
}

function SekceHwZarizeni({ devices }: { devices: HwZarizeni[] | undefined }) {
  if (!Array.isArray(devices)) {
    return null
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5">
        <p className="text-sm text-gray-400 leading-snug">
          HW zařízení pro tento projekt nejsou v ERP zatím evidována.
        </p>
        <p className="mt-1 text-xs text-gray-500 leading-snug">Sekce je připravena pro budoucí data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {devices.map((d, idx) => {
        const title = pickDeviceTitle(d, idx)
        const entries = primitiveEntries(d)
        return (
          <div
            key={`hw-${idx}`}
            className="rounded-lg border border-gray-700/60 bg-gray-900/35 px-4 py-4 md:px-5"
          >
            <div className="text-base font-semibold text-white leading-tight">{title}</div>
            {entries.length ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                {entries.map((e) => (
                  <div key={e.key} className="min-w-0">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      {humanLabelFromKey(e.key)}
                    </div>
                    <div className="mt-0.5 text-sm text-gray-200 break-words">{e.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500">Bez detailů.</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SekceFirewall({ config }: { config: HwswConfig }) {
  if (!config.fw_pristupy.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5 text-sm text-gray-400">
        Žádné záznamy firewall přístupů.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/50">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              IP adresa
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              ID firmy
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Popis
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/70">
          {config.fw_pristupy.map((row, idx) => (
            <tr key={`${row.ip_adresa}-${idx}`} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 align-top text-sm text-gray-200">
                <span className="font-mono text-[12px] text-gray-200">{row.ip_adresa || '—'}</span>
              </td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{row.id_firmy || '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{row.popis || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SekceDomenoviUzivatele({ config }: { config: HwswConfig }) {
  if (!config.dom_users.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5 text-sm text-gray-400">
        Žádní doménoví uživatelé.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/50">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Login
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Doména
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Uživatelské jméno
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Poznámka
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/70">
          {config.dom_users.map((u, idx) => (
            <tr key={`${u.login}-${idx}`} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 align-top text-sm text-gray-200">
                <span className="font-mono text-[12px] text-gray-200">{u.login || '—'}</span>
              </td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{u.domena || '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{u.username || '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{u.poznamka || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SekceEmail({ config }: { config: HwswConfig }) {
  if (!config.set_send_mail.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5 text-sm text-gray-400">
        Žádné nastavení emailu.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/30">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/50">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Firma
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Server
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Port
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Login
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Poznámka
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/70">
          {config.set_send_mail.map((m, idx) => (
            <tr key={`${m.id_firmy}-${m.ip_adresa}-${idx}`} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 align-top text-sm text-gray-300">{m.id_firmy || '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-200">
                <span className="font-mono text-[12px] text-gray-200">{m.ip_adresa || '—'}</span>
              </td>
              <td className="px-4 py-3 align-top text-sm text-gray-300 tabular-nums">{m.port ?? '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{m.login || '—'}</td>
              <td className="px-4 py-3 align-top text-sm text-gray-300">{m.poznamka || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SekceExterniSluzby({ config }: { config: HwswConfig }) {
  if (!config.ext_sluzby.length) {
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-5 py-5 text-sm text-gray-400">
        Žádné externí služby.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {config.ext_sluzby.map((s, idx) => (
        <div
          key={`${s.nazev}-${idx}`}
          className="rounded-lg border border-gray-700/60 bg-gray-900/35 px-4 py-4 md:px-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-base font-semibold text-white leading-tight">
                {s.nazev || '—'}
              </div>
              {s.popis ? (
                <div className="mt-0.5 text-sm text-gray-400 leading-snug">{s.popis}</div>
              ) : null}
            </div>
          </div>
          {s.poznamka ? (
            <div className="mt-3 rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2.5">
              <div className="text-xs text-gray-500 mb-1">Poznámka</div>
              <div className="text-sm text-gray-300 whitespace-pre-line leading-snug">
                {s.poznamka}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">Bez poznámky.</div>
          )}
        </div>
      ))}
    </div>
  )
}


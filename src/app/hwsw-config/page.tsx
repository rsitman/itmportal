import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { HwswConfig } from '@/types/hwsw-config'
import PrehledHwswConfig from '@/components/hwsw-config/PrehledHwswConfig'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
  title: 'HW/SW konfigurace',
  description: 'Technická dokumentace a konfigurace projektu',
}

function safeTrim(value: string | undefined): string {
  return (value ?? '').trim()
}

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function normalizeHwswConfig(raw: unknown): HwswConfig {
  const data = (typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >

  const hasHwZarizeniKey = hasOwn(data, 'hw_zarizeni')
  const rawHw = hasHwZarizeniKey ? (data as any).hw_zarizeni : undefined
  const hw_zarizeni = hasHwZarizeniKey ? (Array.isArray(rawHw) ? rawHw : []) : undefined

  return {
    fw_pristupy: (data.fw_pristupy as HwswConfig['fw_pristupy']) || [],
    dom_users: (data.dom_users as HwswConfig['dom_users']) || [],
    set_send_mail: (data.set_send_mail as HwswConfig['set_send_mail']) || [],
    ext_sluzby: (data.ext_sluzby as HwswConfig['ext_sluzby']) || [],
    servery: (data.servery as HwswConfig['servery']) || [],
    ...(hasHwZarizeniKey ? { hw_zarizeni } : {}),
  }
}

async function fetchHwswConfigFromErp(projekt: string): Promise<HwswConfig> {
  const erpBaseUrl = process.env.ERP_API_URL || 'http://itmsql01:44612/web'
  const erpUrl = `${erpBaseUrl}/projects/${encodeURIComponent(projekt)}/itconf`
  logger.log(`[HWSW_CONFIG_PAGE] projekt=${projekt} erpUrl=${erpUrl}`)

  const response = await fetch(erpUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const bodyPreview = await response.text().then((t) => t.slice(0, 200)).catch(() => '')
    throw new Error(
      `ERP error: ${response.status} ${response.statusText}` + (bodyPreview ? ` (${bodyPreview})` : ''),
    )
  }

  const json = (await response.json()) as unknown
  return normalizeHwswConfig(json)
}

export default async function HwswConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const params = await searchParams
  const projekt = safeTrim(params.projekt)
  if (!projekt) {
    return (
      <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
        <div className="space-y-6">
          <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
            <header className="border-b border-gray-700/50 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                HW/SW konfigurace
              </h1>
              <p className="mt-1 text-sm text-gray-400 leading-snug">
                Chybí povinný parametr <span className="font-mono text-gray-300">projekt</span>.
              </p>
            </header>
            <div className="mt-4 text-sm text-gray-400">
              Otevřete stránku z detailu projektu (Doklad projektu), který parametr doplňuje automaticky.
            </div>
          </div>
        </div>
      </div>
    )
  }

  let config: HwswConfig | null = null
  let errorMessage: string | null = null

  try {
    config = await fetchHwswConfigFromErp(projekt)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    errorMessage = message
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-lg border border-amber-700/40 bg-amber-900/15 px-5 py-5">
            <div className="text-base font-semibold text-amber-100/90">Chyba načtení</div>
            <p className="mt-1 text-sm text-amber-100/80 leading-snug">
              Nepodařilo se načíst HW/SW konfiguraci projektu.
            </p>
            <p className="mt-2 text-[11px] text-amber-200/60 font-mono break-all">{errorMessage}</p>
          </div>
        ) : config ? (
          <PrehledHwswConfig projekt={projekt} config={config} />
        ) : (
          <div className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
            <div className="text-sm text-gray-400">Žádná konfigurace k zobrazení.</div>
          </div>
        )}
      </div>
    </div>
  )
}

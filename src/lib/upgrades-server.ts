const ERP_UPGRADES_URL = 'http://itmsql01:44612/web/upgrades'

export type FetchUpgradesResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string }

/**
 * Načte data upgradů přímo z ERP (itmsql01). Pouze pro použití na serveru
 * (Server Components, API routes). Volání z klienta nepoužívat.
 */
export async function fetchUpgradesFromErp(): Promise<FetchUpgradesResult> {
  try {
    const response = await fetch(ERP_UPGRADES_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Firma-Portal/1.0',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return {
        ok: false,
        error: `Server error: ${response.status} ${response.statusText}`,
      }
    }

    const data: unknown = await response.json()
    return { ok: true, data }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

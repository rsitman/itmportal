import type { Database } from '@/types/database'

const ERP_DATABASES_URL = 'http://itmsql01:44612/web/databases'

export type FetchDatabasesResult =
  | { ok: true; databases: Database[] }
  | { ok: false; error: string; isNetworkError?: boolean }

/**
 * Načte seznam databází přímo z ERP (itmsql01). Pouze pro použití na serveru
 * (Server Components, API routes). Volání z klienta nepoužívat.
 */
export async function fetchDatabasesFromErp(): Promise<FetchDatabasesResult> {
  try {
    const response = await fetch(ERP_DATABASES_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to fetch databases: ${response.status} ${response.statusText}`,
      }
    }

    const databases: Database[] = await response.json()
    const sorted = databases.sort((a, b) =>
      a.firma_nazev.localeCompare(b.firma_nazev, 'cs')
    )

    return { ok: true, databases: sorted }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    const isNetworkError =
      message.includes('fetch') ||
      message.includes('NetworkError') ||
      message.includes('ECONNREFUSED') ||
      message.includes('timeout')

    return {
      ok: false,
      error: message,
      isNetworkError,
    }
  }
}

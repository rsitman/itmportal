/**
 * Typy pro intranetový dashboard (homepage).
 * Data budou později nahrazena API.
 */

export type StatusTyp = 'info' | 'warning' | 'outage' | 'success'

export interface StatusZprava {
  id: string
  text: string
  typ: StatusTyp
  datum?: string
}

export interface PolozkaAplikace {
  id: string
  nazev: string
  popis: string
  href: string
  external?: boolean
  badge?: 'externi' | 'SSO' | 'nove_okno' | null
  ikona: string
}

export interface PolozkaMojePrace {
  id: string
  nazev: string
  href: string
  popis?: string
  pocet?: number
}

export interface PolozkaProvozniInformace {
  id: string
  typ: 'odstavky' | 'oznameni' | 'novinky' | 'zmeny_procesu'
  nadpis: string
  text?: string
  href?: string
  datum?: string
}

export interface PolozkaDokumentyANavody {
  id: string
  nazev: string
  href: string
  kategorie: 'dokument' | 'navod' | 'sablona'
  datum?: string
}

/** Položka aktuality z ERP /web/news */
export interface PolozkaAktualita {
  id: string
  vip?: boolean
  nadpis: string
  obsah?: string
  datum?: string
  projekt?: string
  projekt_nazev?: string
}

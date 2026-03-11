/**
 * Jednotné vizuální tokeny a mapování kategorií pro kalendář.
 * Enterprise tlumená paleta – barva podporuje orientaci, nedominuje.
 */

import type { CalendarEvent } from '@/types/calendar'

/** Kategorie používané ve filtrech (klíče musí odpovídat EventFilters.categories) */
export type EventFilterCategory =
  | 'MEETING'
  | 'OTHER'
  | 'ERP_UPGRADE'
  | 'ERP_PATCH'
  | 'ERP_ABSENCE'

/** Barvy podle typu události – tlumené, konzervativní odstíny */
export const EVENT_TYPE_COLORS: Record<string, string> = {
  MEETING: '#5c6b7a',   // modro-šedá / slate
  OTHER: '#475569',
  PROJECT: '#475569',
  HOLIDAY: '#475569',
  ERP_UPGRADE: '#5b5faa',  // chladná fialovo-modrá
  ERP_PATCH: '#4c4f8a',   // indigo/slate
  ERP_ABSENCE: '#546354',  // zeleno-šedá (všechny absence)
  ERP_HOLIDAY: '#546354',  // legacy → stejná barva jako ERP_ABSENCE
}

/** Barva pro události z Outlooku (zdroj, ne typ) */
export const SOURCE_OUTLOOK_COLOR = '#2e5a8a' // desaturovaná enterprise modrá

/** Barvy podle zdroje (Lokální, ERP, Outlook) – pro badge a indikátory zdroje */
export const SOURCE_COLORS = {
  local: '#5c6b7a',   // modro-šedá
  erp: '#5b5faa',     // tlumená fialovo-modrá
  outlook: '#2e5a8a', // enterprise modrá
} as const

/**
 * Vrátí barvu události pro FullCalendar / filtry.
 * Outlook události mají vždy SOURCE_OUTLOOK_COLOR, ostatní podle resource.type.
 */
export function getEventColor(event: CalendarEvent): string {
  const isOutlook = event.id.startsWith('outlook-') || event.resource?.isOutlookEvent
  if (isOutlook) return SOURCE_OUTLOOK_COLOR
  const type = event.resource?.type ?? 'OTHER'
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.OTHER
}

/**
 * Vrátí kategorii události pro filtraci.
 * Pro ERP události preferuje explicitní erpType (UPGRADE / PATCH / ABSENCE), pak type.
 * Deterministic – jedna událost vždy v jedné kategorii.
 */
export function getEventCategoryForFilter(event: CalendarEvent): EventFilterCategory | null {
  const r = event.resource
  if (!r) return null

  if (r.isErpEvent && r.erpType) {
    if (r.erpType === 'UPGRADE') return 'ERP_UPGRADE'
    if (r.erpType === 'PATCH') return 'ERP_PATCH'
    if (r.erpType === 'ABSENCE' || r.erpType === 'HOLIDAY') return 'ERP_ABSENCE'
    return 'OTHER'
  }

  const t = r.type
  if (t === 'MEETING' || t === 'OTHER' || t === 'ERP_UPGRADE' || t === 'ERP_PATCH' || t === 'ERP_ABSENCE') {
    return t as EventFilterCategory
  }
  if (t === 'ERP_HOLIDAY') return 'ERP_ABSENCE' // legacy
  if (t === 'PROJECT' || t === 'HOLIDAY') return 'OTHER'
  return null
}

/** Barvy pro kategorie ve filtrech – stejné jako EVENT_TYPE_COLORS pro konzistenci */
export const CATEGORY_FILTER_COLORS: Record<EventFilterCategory, string> = {
  MEETING: EVENT_TYPE_COLORS.MEETING,
  OTHER: EVENT_TYPE_COLORS.OTHER,
  ERP_UPGRADE: EVENT_TYPE_COLORS.ERP_UPGRADE,
  ERP_PATCH: EVENT_TYPE_COLORS.ERP_PATCH,
  ERP_ABSENCE: EVENT_TYPE_COLORS.ERP_ABSENCE,
}

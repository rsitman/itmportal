/**
 * Centrální mapování ERP typ_udalosti na UI kategorie, labely a vizuální tokeny.
 * Zdroj pravdy pro klasifikaci ERP událostí podle explicitního sloupce typ_udalosti.
 *
 * typ_udalosti z ERP:
 * 10 = Patchování, 20 = Upgrade
 * 110 = Dovolená, 120 = Nemoc, 130 = Náhradní volno, 140 = Lékař,
 * 150 = Sickday, 160 = OČR, 170 = Homeoffice
 */

/** Interní UI kategorie pro filtr (jedna kategorie může zahrnovat více typ_udalosti) */
export type ErpFilterCategory = 'ERP_PATCH' | 'ERP_UPGRADE' | 'ERP_ABSENCE'

/** Kódy typ_udalosti z ERP */
export const ERP_EVENT_TYPE_PATCH = 10
export const ERP_EVENT_TYPE_UPGRADE = 20
export const ERP_ABSENCE_TYPE_CODES = [110, 120, 130, 140, 150, 160, 170] as const
export type ErpAbsenceTypeCode = (typeof ERP_ABSENCE_TYPE_CODES)[number]

/** Mapování typ_udalosti → uživatelsky čitelný label (pro detail panel) */
export const ERP_EVENT_TYPE_LABELS: Record<number, string> = {
  10: 'Patchování',
  20: 'Upgrade',
  110: 'Dovolená',
  120: 'Nemoc',
  130: 'Náhradní volno',
  140: 'Lékař',
  150: 'Sickday',
  160: 'OČR',
  170: 'Homeoffice',
}

/** Mapování typ_udalosti → interní kategorie pro filtr */
const TYPE_CODE_TO_CATEGORY: Record<number, ErpFilterCategory> = {
  10: 'ERP_PATCH',
  20: 'ERP_UPGRADE',
  110: 'ERP_ABSENCE',
  120: 'ERP_ABSENCE',
  130: 'ERP_ABSENCE',
  140: 'ERP_ABSENCE',
  150: 'ERP_ABSENCE',
  160: 'ERP_ABSENCE',
  170: 'ERP_ABSENCE',
}

/** Interní erpType string (pro Event.erpType) – hodnoty používané v Event modelu */
export type ErpTypeValue = 'PATCH' | 'UPGRADE' | 'ABSENCE'

const TYPE_CODE_TO_ERP_TYPE: Record<number, ErpTypeValue> = {
  10: 'PATCH',
  20: 'UPGRADE',
  110: 'ABSENCE',
  120: 'ABSENCE',
  130: 'ABSENCE',
  140: 'ABSENCE',
  150: 'ABSENCE',
  160: 'ABSENCE',
  170: 'ABSENCE',
}

/**
 * Vrátí interní kategorii pro filtr z kódu typ_udalosti.
 * Pokud kód není znám, vrací null (pak se použije fallback / heuristika).
 */
export function getErpCategoryFromTypeCode(typUdalosti: number): ErpFilterCategory | null {
  return TYPE_CODE_TO_CATEGORY[typUdalosti] ?? null
}

/**
 * Vrátí uživatelsky čitelný label pro detail panel.
 */
export function getErpEventTypeLabel(typUdalosti: number): string {
  return ERP_EVENT_TYPE_LABELS[typUdalosti] ?? 'Neznámý typ'
}

/**
 * Vrátí interní erpType (PATCH / UPGRADE / ABSENCE) z kódu typ_udalosti.
 */
export function getErpTypeFromTypeCode(typUdalosti: number): ErpTypeValue | null {
  return TYPE_CODE_TO_ERP_TYPE[typUdalosti] ?? null
}

/**
 * Rozhodne, zda je kód typ_udalosti platný a známý (pro prioritní klasifikaci).
 */
export function isKnownErpEventTypeCode(typUdalosti: unknown): typUdalosti is number {
  return typeof typUdalosti === 'number' && typUdalosti in TYPE_CODE_TO_CATEGORY
}

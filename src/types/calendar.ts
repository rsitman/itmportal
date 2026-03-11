export interface Event {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  type: 'PROJECT' | 'MEETING' | 'HOLIDAY' | 'OTHER' | 'ERP_UPGRADE' | 'ERP_PATCH' | 'ERP_HOLIDAY' | 'ERP_ABSENCE'
  allDay: boolean
  outlookId?: string
  location?: string
  syncedWithOutlook?: boolean
  lastSyncedAt?: string
  isOutlookEvent?: boolean
  isErpEvent?: boolean
  erpSourceId?: string
  /** Interní typ ERP události: PATCH | UPGRADE | ABSENCE (z typ_udalosti nebo fallback) */
  erpType?: string
  /** Kód typ_udalosti z ERP (10, 20, 110, 120, …) – primární zdroj pro klasifikaci */
  erpEventTypeCode?: number
  /** Uživatelsky čitelný label podle typ_udalosti (Patchování, Dovolená, …) */
  erpEventTypeLabel?: string
  erpProject?: string
  erpJiraKey?: string
  erpResolver?: string
  erpSystems?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: Event
}

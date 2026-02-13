export interface Event {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  type: 'PROJECT' | 'MEETING' | 'HOLIDAY' | 'OTHER' | 'ERP_UPGRADE' | 'ERP_PATCH' | 'ERP_HOLIDAY'
  allDay: boolean
  outlookId?: string
  location?: string
  syncedWithOutlook?: boolean
  lastSyncedAt?: string
  isOutlookEvent?: boolean
  isErpEvent?: boolean
  erpSourceId?: string
  erpType?: string
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

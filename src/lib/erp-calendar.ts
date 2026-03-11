import { Event } from '@/types/calendar'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import {
  isKnownErpEventTypeCode,
  getErpCategoryFromTypeCode,
  getErpTypeFromTypeCode,
  getErpEventTypeLabel,
} from '@/lib/erp-event-type-mapping'

/** Raw ERP event z API – může obsahovat typ_udalosti (primární) nebo starší pole */
export interface ErpEventRaw {
  nazev: string
  datum_od: string
  datum_do: string
  popis?: string
  resitel?: string
  projekt?: string
  jira_klic?: string
  /** Explicitní typ události z ERP: 10=Patch, 20=Upgrade, 110–170=absence */
  typ_udalosti?: number
}

// Legacy interfaces (pro fallback při chybějícím typ_udalosti)
export interface ErpUpgradeEvent extends ErpEventRaw {
  projekt: string
  jira_klic: string
}

export interface ErpPatchEvent extends ErpEventRaw {
  resitel: string
}

export interface ErpHolidayEvent extends ErpEventRaw {
  resitel: string
}

export type ErpEvent = ErpEventRaw

export class ErpCalendarService {
  // Generate unique source ID for ERP event
  static generateSourceId(event: ErpEvent): string {
    if (event.projekt && event.jira_klic) {
      return event.jira_klic
    }
    if (event.resitel) {
      return crypto
        .createHash('md5')
        .update(`${event.resitel}-${event.datum_od}-${event.datum_do}`)
        .digest('hex')
    }
    return crypto
      .createHash('md5')
      .update(`${event.nazev}-${event.datum_od}-${event.datum_do}`)
      .digest('hex')
  }

  // Detect event type
  static isUpgradeEvent(event: any): event is ErpUpgradeEvent {
    return event && typeof event.projekt === 'string' && typeof event.jira_klic === 'string'
  }

  static isPatchEvent(event: any): event is ErpPatchEvent {
    return event && typeof event.projekt === 'undefined' && typeof event.resitel === 'string' && !event.nazev?.toLowerCase().includes('dovolen')
  }

  static isHolidayEvent(event: any): event is ErpHolidayEvent {
    return event && typeof event.projekt === 'undefined' && typeof event.resitel === 'string' && event.nazev?.toLowerCase().includes('dovolen')
  }

  /**
   * Convert ERP event to database Event format.
   * Primární zdroj pravdy: typ_udalosti. Pokud chybí, fallback na heuristiky (název, projekt, jira_klic).
   */
  static convertToDbEvent(event: ErpEvent): any {
    const sourceId = this.generateSourceId(event)
    const startDate = new Date(event.datum_od)
    const endDate = new Date(event.datum_do)
    const base = {
      id: `erp-${sourceId}`,
      title: event.nazev,
      description: event.popis || undefined,
      startDate,
      endDate,
      allDay: true,
      isErpEvent: true,
      erpSourceId: sourceId,
      outlookId: undefined,
    }

    // Primární: explicitní typ_udalosti z ERP
    if (isKnownErpEventTypeCode(event.typ_udalosti)) {
      const code = event.typ_udalosti
      const category = getErpCategoryFromTypeCode(code)
      const erpType = getErpTypeFromTypeCode(code)
      const label = getErpEventTypeLabel(code)
      if (category && erpType) {
        return {
          ...base,
          type: category,
          erpType,
          erpEventTypeCode: code,
          erpEventTypeLabel: label,
          erpProject: event.projekt || undefined,
          erpJiraKey: event.jira_klic || undefined,
          erpResolver: event.resitel || undefined,
          erpSystems: category === 'ERP_PATCH' ? event.popis : undefined,
        }
      }
    }

    // Fallback: heuristiky pro starší data bez typ_udalosti
    if (this.isHolidayEvent(event)) {
      return {
        ...base,
        type: 'ERP_ABSENCE',
        erpType: 'ABSENCE',
        erpEventTypeLabel: 'Dovolená',
        erpProject: undefined,
        erpJiraKey: undefined,
        erpResolver: event.resitel,
        erpSystems: undefined,
      }
    }
    if (this.isUpgradeEvent(event)) {
      return {
        ...base,
        type: 'ERP_UPGRADE',
        erpType: 'UPGRADE',
        erpEventTypeLabel: 'Upgrade',
        erpProject: event.projekt,
        erpJiraKey: event.jira_klic,
        erpResolver: event.resitel,
        erpSystems: undefined,
      }
    }
    if (this.isPatchEvent(event)) {
      return {
        ...base,
        type: 'ERP_PATCH',
        erpType: 'PATCH',
        erpEventTypeLabel: 'Patchování',
        erpProject: undefined,
        erpJiraKey: undefined,
        erpResolver: event.resitel,
        erpSystems: event.popis,
      }
    }

    return {
      ...base,
      type: 'OTHER',
      erpType: 'OTHER',
      erpProject: undefined,
      erpJiraKey: undefined,
      erpResolver: event.resitel,
      erpSystems: undefined,
    }
  }

  // Fetch events from ERP system
  static async fetchErpEvents(): Promise<ErpEvent[]> {
    try {
      // Call ERP directly like other services
      const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612/web'
      const fullUrl = `${erpUrl}/calendar`
      
      logger.log('ErpCalendarService: Fetching from:', fullUrl)
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // ERP calendar endpoint not implemented - this is expected
          logger.log('ErpCalendarService: ERP calendar endpoint not available (404)')
          return [] // Return empty array instead of throwing error
        }
        logger.error('ErpCalendarService: HTTP error:', response.status, response.statusText)
        throw new Error(`Failed to fetch ERP events: ${response.status} ${response.statusText}`)
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        logger.error('ErpCalendarService: Non-JSON response:', text.substring(0, 200))
        throw new Error('ERP server returned non-JSON response. Server may require authentication.')
      }
      
      const data = await response.json()
      logger.log('ErpCalendarService: Successfully fetched ERP events:', Array.isArray(data) ? data.length : 'not an array')
      return Array.isArray(data) ? data : []
    } catch (error) {
      logger.error('ErpCalendarService: Error fetching ERP events:', error)
      throw error
    }
  }

  // Synchronize ERP events with database
  static async syncErpEvents(): Promise<{
    created: number
    updated: number
    deleted: number
    errors: string[]
  }> {
    const result = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[]
    }

    try {
      // First, delete ALL existing ERP events from database
      logger.log('ERP Sync: Deleting all existing ERP events...')
      const deleteResult = await (prisma.event as any).deleteMany({
        where: { isErpEvent: true }
      })
      result.deleted = deleteResult.count
      logger.log(`ERP Sync: Deleted ${deleteResult.count} existing ERP events`)

      // Fetch all ERP events from ERP system
      const erpEvents = await this.fetchErpEvents()
      logger.log(`ERP Sync: Fetched ${erpEvents.length} events from ERP system`)

      // Create all events fresh
      for (const erpEvent of erpEvents) {
        try {
          const dbEvent = this.convertToDbEvent(erpEvent)
          
          await (prisma.event as any).create({
            data: dbEvent
          })
          result.created++
        } catch (error) {
          result.errors.push(`Failed to create ERP event ${erpEvent.nazev}: ${error}`)
        }
      }

      logger.log(`ERP Sync completed: ${result.created} created, ${result.deleted} deleted`)
      return result

    } catch (error) {
      result.errors.push(`Sync failed: ${error}`)
      return result
    }
  }

  // Get ERP events from database
  static async getErpEvents(): Promise<Event[]> {
    try {
      const events = await (prisma.event as any).findMany({
        where: { isErpEvent: true },
        orderBy: { startDate: 'asc' }
      })

      return events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        type: event.type as Event['type'],
        allDay: event.allDay,
        outlookId: event.outlookId || undefined,
        location: undefined,
        syncedWithOutlook: event.outlookId ? true : undefined,
        lastSyncedAt: undefined,
        isOutlookEvent: false,
        isErpEvent: true,
        erpSourceId: event.erpSourceId || undefined,
        erpType: event.erpType || undefined,
        erpEventTypeCode: event.erpEventTypeCode ?? undefined,
        erpEventTypeLabel: event.erpEventTypeLabel ?? undefined,
        erpProject: event.erpProject || undefined,
        erpJiraKey: event.erpJiraKey || undefined,
        erpResolver: event.erpResolver || undefined,
        erpSystems: event.erpSystems || undefined,
      }))
    } catch (error) {
      logger.error('Error fetching ERP events from database:', error)
      throw error
    }
  }

  // Check if user can edit ERP events
  static canEditErpEvent(userRole: string): boolean {
    return ['ADMIN', 'IT', 'MANAGER'].includes(userRole)
  }

  // Check if user can delete ERP events
  static canDeleteErpEvent(userRole: string): boolean {
    return ['ADMIN', 'IT'].includes(userRole)
  }

  // Check if user can sync ERP events
  static canSyncErpEvents(userRole: string): boolean {
    return ['ADMIN', 'IT'].includes(userRole)
  }
}

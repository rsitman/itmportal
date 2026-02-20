import { Event } from '@/types/calendar'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

// ERP event interfaces
export interface ErpUpgradeEvent {
  projekt: string
  nazev: string
  datum_od: string
  datum_do: string
  popis: string
  resitel: string
  jira_klic: string
}

export interface ErpPatchEvent {
  nazev: string
  datum_od: string
  datum_do: string
  popis: string
  resitel: string
}

export interface ErpHolidayEvent {
  nazev: string
  datum_od: string
  datum_do: string
  popis: string
  resitel: string
}

export type ErpEvent = ErpUpgradeEvent | ErpPatchEvent | ErpHolidayEvent

export class ErpCalendarService {
  // Generate unique source ID for ERP event
  static generateSourceId(event: ErpEvent): string {
    if ('projekt' in event) {
      // Upgrade event - use jira_klic as unique identifier
      return event.jira_klic
    } else if ('resitel' in event) {
      // Patch or Holiday event - generate hash from resolver and dates
      return crypto
        .createHash('md5')
        .update(`${event.resitel}-${event.datum_od}-${event.datum_do}`)
        .digest('hex')
    }
    return 'unknown'
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

  // Convert ERP event to database Event format
  static convertToDbEvent(event: ErpEvent): any {
    const sourceId = this.generateSourceId(event)
    const startDate = new Date(event.datum_od)
    const endDate = new Date(event.datum_do)

    if (this.isUpgradeEvent(event)) {
      return {
        id: `erp-${sourceId}`,
        title: event.nazev,
        description: event.popis || undefined,
        startDate,
        endDate,
        type: 'ERP_UPGRADE',
        allDay: true,
        isErpEvent: true,
        erpSourceId: sourceId,
        erpType: 'UPGRADE',
        erpProject: event.projekt,
        erpJiraKey: event.jira_klic,
        erpResolver: event.resitel,
        erpSystems: undefined,
        // ownerId: undefined, // ERP events have no owner
        outlookId: undefined,
      }
    } else if (this.isPatchEvent(event)) {
      return {
        id: `erp-${sourceId}`,
        title: event.nazev,
        description: event.popis || undefined,
        startDate,
        endDate,
        type: 'ERP_PATCH',
        allDay: true,
        isErpEvent: true,
        erpSourceId: sourceId,
        erpType: 'PATCH',
        erpProject: undefined,
        erpJiraKey: undefined,
        erpResolver: event.resitel,
        erpSystems: event.popis, // For patch events, description contains systems
        // ownerId: undefined, // ERP events have no owner
        outlookId: undefined,
      }
    } else if (this.isHolidayEvent(event)) {
      return {
        id: `erp-${sourceId}`,
        title: (event as any).nazev,
        description: (event as any).popis || undefined,
        startDate,
        endDate,
        type: 'ERP_HOLIDAY',
        allDay: true,
        isErpEvent: true,
        erpSourceId: sourceId,
        erpType: 'HOLIDAY',
        erpProject: undefined,
        erpJiraKey: undefined,
        erpResolver: (event as any).resitel,
        erpSystems: undefined,
        // ownerId: undefined, // ERP events have no owner
        outlookId: undefined,
      }
    }
    
    // Fallback for unknown types
    return {
      id: `erp-${sourceId}`,
      title: (event as any).nazev,
      description: (event as any).popis || undefined,
      startDate,
      endDate,
      type: 'OTHER',
      allDay: true,
      isErpEvent: true,
      erpSourceId: sourceId,
      erpType: 'OTHER',
      erpProject: undefined,
      erpJiraKey: undefined,
      erpResolver: (event as any).resitel,
      erpSystems: undefined,
      outlookId: undefined,
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

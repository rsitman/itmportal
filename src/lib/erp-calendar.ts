import { Event } from '@/types/calendar'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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

export type ErpEvent = ErpUpgradeEvent | ErpPatchEvent

export class ErpCalendarService {
  // Generate unique source ID for ERP event
  static generateSourceId(event: ErpEvent): string {
    if ('projekt' in event) {
      // Upgrade event - use jira_klic as unique identifier
      return event.jira_klic
    } else {
      // Patch event - generate hash from resolver and dates
      return crypto
        .createHash('md5')
        .update(`${event.resitel}-${event.datum_od}-${event.datum_do}`)
        .digest('hex')
    }
  }

  // Detect event type
  static isUpgradeEvent(event: any): event is ErpUpgradeEvent {
    return event && typeof event.projekt === 'string' && typeof event.jira_klic === 'string'
  }

  static isPatchEvent(event: any): event is ErpPatchEvent {
    return event && typeof event.projekt === 'undefined' && typeof event.resitel === 'string'
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
    } else {
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
    }
  }

  // Fetch events from ERP system
  static async fetchErpEvents(): Promise<ErpEvent[]> {
    try {
      // Použijeme absolutní URL pro server-side fetch
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : 'http://localhost:3000'
      
      console.log('ErpCalendarService: Fetching from:', `${baseUrl}/api/erp-proxy/calendar`)
      const response = await fetch(`${baseUrl}/api/erp-proxy/calendar`)
      
      if (!response.ok) {
        console.error('ErpCalendarService: HTTP error:', response.status, response.statusText)
        throw new Error(`Failed to fetch ERP events: ${response.status} ${response.statusText}`)
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('ErpCalendarService: Non-JSON response:', text.substring(0, 200))
        throw new Error('ERP server returned non-JSON response. Server may require authentication.')
      }
      
      const data = await response.json()
      console.log('ErpCalendarService: Successfully fetched ERP events:', Array.isArray(data) ? data.length : 'not an array')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('ErpCalendarService: Error fetching ERP events:', error)
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
      // Fetch all ERP events
      const erpEvents = await this.fetchErpEvents()
      
      // Get existing ERP events from database
      const existingErpEvents = await (prisma.event as any).findMany({
        where: { isErpEvent: true },
        select: { id: true, erpSourceId: true }
      })

      const existingSourceIds = new Set(existingErpEvents.map((e: any) => e.erpSourceId).filter(Boolean))
      const incomingSourceIds = new Set(erpEvents.map(e => this.generateSourceId(e)))

      // Find events to delete (ERP events that no longer exist in ERP)
      const toDelete = existingErpEvents.filter((e: any) => 
        e.erpSourceId && !incomingSourceIds.has(e.erpSourceId)
      )

      // Delete obsolete events
      for (const event of toDelete) {
        try {
          await (prisma.event as any).delete({ where: { id: (event as any).id } })
          result.deleted++
        } catch (error) {
          result.errors.push(`Failed to delete event ${(event as any).id}: ${error}`)
        }
      }

      // Create or update events
      for (const erpEvent of erpEvents) {
        try {
          const dbEvent = this.convertToDbEvent(erpEvent)
          const sourceId = dbEvent.erpSourceId!

          // Check if event already exists
          const existing = await (prisma.event as any).findUnique({
            where: { erpSourceId: sourceId }
          })

          if (existing) {
            // Update existing event
            await (prisma.event as any).update({
              where: { id: existing.id },
              data: {
                title: dbEvent.title,
                description: dbEvent.description,
                startDate: dbEvent.startDate,
                endDate: dbEvent.endDate,
                updatedAt: new Date()
              }
            })
            result.updated++
          } else {
            // Create new event
            await (prisma.event as any).create({
              data: dbEvent
            })
            result.created++
          }
        } catch (error) {
          result.errors.push(`Failed to sync ERP event ${erpEvent.nazev}: ${error}`)
        }
      }

      console.log(`ERP Sync completed: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`)
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
      console.error('Error fetching ERP events from database:', error)
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

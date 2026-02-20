import { Event } from '@/types/calendar'
import { logger } from '@/lib/logger'

export interface OutlookEvent {
  id: string
  subject: string
  bodyPreview?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  isAllDay: boolean
}

export class OutlookCalendarService {
  // Check if user has Outlook integration enabled
  static hasOutlookIntegration(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('outlook_integration_enabled') === 'true'
    }
    return false
  }

  // Enable/disable Outlook integration
  static setOutlookIntegration(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('outlook_integration_enabled', enabled.toString())
    }
  }

  // Fetch Outlook events
  static async fetchOutlookEvents(
    startDate?: string, 
    endDate?: string
  ): Promise<OutlookEvent[]> {
    try {
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDateTime', startDate)
      if (endDate) params.append('endDateTime', endDate)
      
      const response = await fetch(`/api/outlook-calendar?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Outlook events: ${response.status}`)
      }
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error(`Failed to parse API response: ${parseError}`)
      }
      
      // Data je přímo pole
      const events = Array.isArray(data) ? data : []
      
      if (events.length > 0) {
        // Validace dat
        events.forEach((event: any) => {
          if (!event.id || !event.start) {
            throw new Error('Invalid event data: missing required fields')
          }
        })
      }
      
      return events
    } catch (error) {
      throw error
    }
  }

  // Get more events (up to 999)
  static async fetchMoreOutlookEvents(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const start = startDate || new Date().toISOString()
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const response = await fetch(`/api/outlook-events-more?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`)
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch more Outlook events: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        return []
      }
      
      const events = data.map((event: any) => ({
        id: event.id,
        subject: event.subject || 'Bez názvu',
        bodyPreview: event.bodyPreview || '',
        start: event.start,
        end: event.end,
        location: event.location?.displayName || '',
        isAllDay: event.isAllDay || false
      }))
      
      return events
    } catch (error) {
      logger.error('Error in OutlookCalendarService.fetchMoreOutlookEvents:', error)
      throw error
    }
  }

  // Get user info
  static async getUserInfo(): Promise<any> {
    try {
      const response = await fetch('/api/user-info')
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch user info: ${response.status}`)
      }
      
      const data = await response.json()
      
      return data
    } catch (error) {
      logger.error('Error getting user info:', error)
      throw error
    }
  }

  // Get all calendars
  static async getCalendars(): Promise<any[]> {
    try {
      const response = await fetch('/api/outlook-calendars')
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch calendars: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!Array.isArray(data)) {
        return []
      }
      
      return data
    } catch (error) {
      logger.error('Error getting calendars:', error)
      throw error
    }
  }

  // Create event in Outlook
  static async createOutlookEvent(event: any): Promise<OutlookEvent | null> {
    try {
      const response = await fetch('/api/outlook-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          allDay: event.allDay,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create Outlook event')
      }

      return await response.json()
    } catch (error) {
      logger.error('Error creating Outlook event:', error)
      throw error
    }
  }

  // Sync local event to Outlook
  static async syncToOutlook(event: Event): Promise<Event | null> {
    try {
      if (event.syncedWithOutlook && event.outlookId) {
        // Event already synced - could implement update logic here
        return event
      }

      const outlookEvent = await this.createOutlookEvent(event)
      if (!outlookEvent) {
        throw new Error('Failed to sync event to Outlook')
      }

      // Update local event with Outlook data
      const updatedEvent: Event = {
        ...event,
        outlookId: outlookEvent.id,
        syncedWithOutlook: true,
        lastSyncedAt: new Date().toISOString(),
      }

      // Update event in local database
      await this.updateLocalEvent(updatedEvent)
      
      return updatedEvent
    } catch (error) {
      logger.error('Error syncing event to Outlook:', error)
      throw error
    }
  }

  // Update local event in database
  private static async updateLocalEvent(event: Event): Promise<void> {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outlookId: event.outlookId,
          syncedWithOutlook: event.syncedWithOutlook,
          lastSyncedAt: event.lastSyncedAt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update local event')
      }
    } catch (error) {
      logger.error('Error updating local event:', error)
      throw error
    }
  }

  // Sync Outlook events with database
  static async syncOutlookEvents(): Promise<{
    created: number
    deleted: number
    errors: string[]
  }> {
    const result = {
      created: 0,
      deleted: 0,
      errors: [] as string[]
    }

    try {
      // First, delete ALL existing Outlook events from database
      logger.log('Outlook Sync: Deleting all existing Outlook events...')
      const deleteResult = await fetch('/api/events/outlook/delete-all', {
        method: 'DELETE'
      })
      
      if (deleteResult.ok) {
        const deleteData = await deleteResult.json()
        result.deleted = deleteData.deleted
        logger.log(`Outlook Sync: Deleted ${deleteData.deleted} existing Outlook events`)
      } else {
        const errorText = await deleteResult.text()
        result.errors.push(`Failed to delete existing Outlook events: ${errorText}`)
        return result
      }

      // Fetch all Outlook events
      logger.log('Outlook Sync: Fetching events from Outlook...')
      const outlookEvents = await this.fetchOutlookEvents()
      logger.log(`Outlook Sync: Fetched ${outlookEvents.length} events from Outlook`)

      if (outlookEvents.length === 0) {
        result.errors.push('No Outlook events found - user may not have calendar access or no events in date range')
        return result
      }

      // Create all events fresh
      for (const outlookEvent of outlookEvents) {
        try {
          const startDate = new Date(outlookEvent.start.dateTime)
          const endDate = new Date(outlookEvent.end.dateTime)
          
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: outlookEvent.subject,
              description: outlookEvent.bodyPreview || '',
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              type: 'MEETING',
              allDay: outlookEvent.isAllDay || false,
              outlookId: outlookEvent.id,
            }),
          })

          if (response.ok) {
            result.created++
          } else {
            const errorText = await response.text()
            result.errors.push(`Failed to save Outlook event "${outlookEvent.subject}": ${errorText}`)
          }
        } catch (error) {
          result.errors.push(`Failed to sync Outlook event "${outlookEvent.subject}": ${error}`)
        }
      }

      logger.log(`Outlook Sync completed: ${result.created} created, ${result.deleted} deleted`)
      return result

    } catch (error) {
      logger.error('Outlook Sync error:', error)
      result.errors.push(`Sync failed: ${error}`)
      return result
    }
  }

  // Convert Outlook event to local Event format
  static outlookEventToLocal(outlookEvent: OutlookEvent): any {
    return {
      title: outlookEvent.subject,
      description: outlookEvent.bodyPreview,
      start: outlookEvent.start.dateTime,
      end: outlookEvent.end.dateTime,
      allDay: outlookEvent.isAllDay,
      location: outlookEvent.location?.displayName,
      outlookId: outlookEvent.id,
      syncedWithOutlook: true,
      lastSyncedAt: new Date().toISOString(),
    }
  }
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Event, CalendarEvent } from '@/types/calendar'
import { OutlookCalendarService } from '@/lib/outlook-calendar'
import { ErpCalendarService } from '@/lib/erp-calendar'
import EventFilterPanel from '@/components/EventFilterPanel'
import { logger } from '@/lib/logger'

// Setup localizer
const locales = {
  'cs': cs,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Pondělí jako začátek týdne
  getDay,
  locales: {
    'cs': cs
  },
  culture: 'cs'
})

// Event styling function with hover
const eventStyleGetter = (event: CalendarEvent) => {
  const isOutlookEvent = event.id.startsWith('outlook-')
  const isErpEvent = event.resource?.isErpEvent
  
  const baseColor = {
    PROJECT: '#3b82f6', // blue-500
    MEETING: '#f97316', // orange-500
    HOLIDAY: '#10b981', // emerald-500
    OTHER: '#6b7280', // gray-500
    ERP_UPGRADE: '#8b5cf6', // violet-500
    ERP_PATCH: '#a855f7', // purple-500
    ERP_HOLIDAY: '#22c55e', // green-500
  }[event.resource?.type || 'OTHER']
  
  const backgroundColor = isOutlookEvent ? '#0078d4' : baseColor
  
  return {
    style: {
      backgroundColor,
      borderRadius: '6px',
      opacity: isOutlookEvent ? 0.8 : 0.9,
      border: 'none',
      color: 'white',
      padding: '2px 6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      minHeight: '24px',
      whiteSpace: 'normal',
      overflow: 'visible',
      zIndex: 10,
      lineHeight: '1.3'
    }
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [outlookEnabled, setOutlookEnabled] = useState(false)
  const [syncingWithOutlook, setSyncingWithOutlook] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [outlookEventCount, setOutlookEventCount] = useState(0)
  
  // ERP states
  const [erpEnabled, setErpEnabled] = useState(true)
  const [syncingWithErp, setSyncingWithErp] = useState(false)
  const [erpSyncError, setErpSyncError] = useState<string | null>(null)
  const [erpEventCount, setErpEventCount] = useState(0)
  const [localEventCount, setLocalEventCount] = useState(0)
  const [userRole, setUserRole] = useState<string>('')
  
  // Calendar refs
  const calendarRef = useRef<Calendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<string>('month')
  
  // Event filters state
  const [eventFilters, setEventFilters] = useState({
    showLocal: true,
    showErp: true,
    showOutlook: true,
    categories: {
      MEETING: true,
      OTHER: true,
      ERP_UPGRADE: true,
      ERP_PATCH: true,
      ERP_HOLIDAY: true,
    }
  })
  
  // Tooltip cleanup on mount
  useEffect(() => {
    const handleGlobalMouseLeave = () => {
      const tooltip = document.querySelector('.event-tooltip')
      if (tooltip) {
        tooltip.remove()
      }
    }
    
    document.addEventListener('mouseleave', handleGlobalMouseLeave, true)
    
    return () => {
      document.removeEventListener('mouseleave', handleGlobalMouseLeave)
      const tooltip = document.querySelector('.event-tooltip')
      if (tooltip) {
        tooltip.remove()
      }
    }
  }, []) 
  
  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)
    switch (direction) {
      case 'prev':
        if (currentView === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() - 1)
        } else if (currentView === Views.WEEK) {
          newDate.setDate(newDate.getDate() - 7)
        } else {
          newDate.setDate(newDate.getDate() - 1)
        }
        break
      case 'next':
        if (currentView === Views.MONTH) {
          newDate.setMonth(newDate.getMonth() + 1)
        } else if (currentView === Views.WEEK) {
          newDate.setDate(newDate.getDate() + 7)
        } else {
          newDate.setDate(newDate.getDate() + 1)
        }
        break
      case 'today':
        // Already today
        break
    }
    setCurrentDate(newDate)
  }

  const changeView = (view: string) => {
    setCurrentView(view)
  }

  // Session check
  useEffect(() => {
    logger.log('Calendar - Session status:', status)
    logger.log('Calendar - Session data:', session)
    
    if (status === 'loading') {
      return // Čekáme na session
    }
    
    if (status === 'unauthenticated') {
      logger.log('Calendar - User not authenticated, redirecting to login')
      router.push('/login')
      return
    }
    
    if (session?.user) {
      setUserRole(session.user.role || '')
      logger.log('Calendar - User authenticated:', session.user.email, 'Role:', session.user.role)
    }
    
    setLoading(false)
  }, [session, status, router])

  const fetchEvents = async () => {
    logger.log('fetchEvents: Starting fetch')
    setLoading(true)
    try {
      const response = await fetch('/api/events')
      logger.log('fetchEvents: Response status:', response.status)
      
      if (response.ok) {
        const data: Event[] = await response.json()
        logger.log('fetchEvents: Raw data:', data)
        logger.log('fetchEvents: Data length:', data.length)
        
        const calendarEvents: CalendarEvent[] = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          allDay: event.allDay,
          resource: event,
        }))
        
        logger.log('fetchEvents: Mapped events:', calendarEvents)
        logger.log('fetchEvents: Sample event:', calendarEvents[0])
        logger.log('fetchEvents: Calendar component rendering with events:', events.length)
        setEvents(calendarEvents)

        // Update ERP and local event counts
        const erpEvents = data.filter(event => event.isErpEvent)
        const localEvents = data.filter(event => !event.isErpEvent)
        logger.log('fetchEvents: ERP events count:', erpEvents.length)
        logger.log('fetchEvents: Local events count:', localEvents.length)
        setErpEventCount(erpEvents.length)
        setLocalEventCount(localEvents.length)
        
        // Clear any previous sync errors
        setErpSyncError(null)
      } else {
        const errorText = await response.text()
        logger.error('fetchEvents: Response not OK:', response.status, response.statusText, errorText)
        setErpSyncError(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      logger.error('Error fetching events:', error)
      setErpSyncError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on current filters
  const filterEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => {
      const isOutlookEvent = event.id.startsWith('outlook-')
      const isErpEvent = event.resource?.isErpEvent
      const eventType = event.resource?.type

      // Source filters
      if (!eventFilters.showLocal && !isOutlookEvent && !isErpEvent) return false
      if (!eventFilters.showErp && isErpEvent) return false
      if (!eventFilters.showOutlook && isOutlookEvent) return false

      // Category filters
      if (eventType && !eventFilters.categories[eventType as keyof typeof eventFilters.categories]) {
        return false
      }

      return true
    })
  }

  // Tooltip functions
  const showTooltip = (event: React.MouseEvent, title: string, description?: string) => {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.event-tooltip')
    if (existingTooltip) {
      existingTooltip.remove()
    }

    // Create tooltip with better formatting
    const tooltip = document.createElement('div')
    tooltip.className = 'event-tooltip'
    
    // Format description properly with HTML line breaks
    const formattedDescription = description ? description.replace(/\n/g, '<br>') : ''
    
    tooltip.innerHTML = `
      <div class="event-tooltip-title">${title}</div>
      ${formattedDescription ? `<div class="event-tooltip-description">${formattedDescription}</div>` : ''}
    `
    
    // Position tooltip better with more accurate positioning
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    
    // Calculate position to avoid viewport issues
    let left = rect.left + scrollLeft
    let top = rect.bottom + scrollTop + 8
    
    // Adjust if tooltip would go off screen
    if (left + 350 > window.innerWidth) {
      left = window.innerWidth - 370
    }
    if (top + 200 > window.innerHeight) {
      top = rect.top + scrollTop - 220
    }
    
    tooltip.style.position = 'fixed'
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
    tooltip.style.zIndex = '10000'
    
    document.body.appendChild(tooltip)
    
    // Debug log
    logger.log('Tooltip created:', { title, description, left, top })
  }

  const hideTooltip = () => {
    const tooltip = document.querySelector('.event-tooltip')
    if (tooltip) {
      tooltip.remove()
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedEvent(null)
    setSelectedSlot(null)
  }

  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          startDate: eventData.start,
          endDate: eventData.end,
          type: eventData.type || 'OTHER',
          allDay: eventData.allDay || false,
        }),
      })

      if (response.ok) {
        await fetchEvents()
        setShowModal(false)
        setSelectedEvent(null)
        setSelectedSlot(null)
      }
    } catch (error) {
      logger.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async (eventData: any) => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          startDate: eventData.start,
          endDate: eventData.end,
          type: eventData.type || 'OTHER',
          allDay: eventData.allDay || false,
        }),
      })

      if (response.ok) {
        await fetchEvents()
        setShowModal(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      logger.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchEvents()
        setShowModal(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      logger.error('Error deleting event:', error)
    }
  }

  const toggleOutlookIntegration = () => {
    setOutlookEnabled(!outlookEnabled)
  }

  const syncMoreOutlookEvents = async () => {
    if (!outlookEnabled) return

    setSyncingWithOutlook(true)
    setSyncError(null)

    try {
      const result = await OutlookCalendarService.syncOutlookEvents()
      logger.log('Outlook Sync result:', result)
      
      if (result.errors.length > 0) {
        setSyncError(result.errors.join('; '))
      }
      
      // fetchEvents already updates all counts — no need for duplicate fetch
      await fetchEvents()
    } catch (error) {
      setSyncError('Failed to sync Outlook events')
    } finally {
      setSyncingWithOutlook(false)
    }
  }

  const syncErpEvents = async () => {
    logger.log('syncErpEvents: Starting ERP sync')
    setSyncingWithErp(true)
    setErpSyncError(null)

    try {
      const result = await fetch('/api/erp-calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!result.ok) {
        const errorText = await result.text()
        logger.error('syncErpEvents: Sync failed with status:', result.status, errorText)
        throw new Error(`Sync failed: ${result.status} ${result.statusText}`)
      }

      const syncResult = await result.json()
      logger.log('syncErpEvents: ERP Sync result:', syncResult)
      
      // fetchEvents already updates all counts — no need for duplicate fetch
      await fetchEvents()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('syncErpEvents: Sync error:', error)
      setErpSyncError('Sync failed: ' + errorMessage)
    } finally {
      setSyncingWithErp(false)
    }
  }

  // Load events on component mount and when session is ready
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchEvents()
    }
  }, [session, status])

  // Add debug styles to make calendar visible and force re-render
  useEffect(() => {
    // Force calendar to be visible
    const calendarElements = document.querySelectorAll('.rbc-calendar')
    calendarElements.forEach((el: any) => {
      if (el) {
        ;(el as HTMLElement).style.display = 'block'
        ;(el as HTMLElement).style.visibility = 'visible'
        ;(el as HTMLElement).style.opacity = '1'
        ;(el as HTMLElement).style.height = '500px'
        ;(el as HTMLElement).style.minHeight = '500px'
      }
    })
    
    // Force re-render of calendar
    if (events.length > 0) {
      logger.log('Forcing calendar re-render with events:', events.length)
      const calendarElement = document.querySelector('.rbc-calendar')
      if (calendarElement) {
        ;(calendarElement as HTMLElement).style.display = 'none'
        ;(calendarElement as HTMLElement).style.visibility = 'hidden'
        
        setTimeout(() => {
          ;(calendarElement as HTMLElement).style.display = 'block'
          ;(calendarElement as HTMLElement).style.visibility = 'visible'
        }, 100)
      }
    }
    
    // Add event listeners to ensure tooltips work
    const handleGlobalClick = () => {
      const tooltip = document.querySelector('.event-tooltip')
      if (tooltip) {
        tooltip.remove()
      }
    }
    
    document.addEventListener('click', handleGlobalClick, true)
    
    return () => {
      document.removeEventListener('click', handleGlobalClick)
      const tooltip = document.querySelector('.event-tooltip')
      if (tooltip) {
        tooltip.remove()
      }
    }
  }, [events, currentView, currentDate])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-transparent">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="card-professional p-4 w-full" style={{ minHeight: '600px' }}>
          <header className="flex h-16 items-center justify-between border-b border-gray-700/50 bg-gray-900/80 px-6 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-300">
                  <span>Lokální události: </span>
                  <span className="font-semibold text-green-400">{localEventCount}</span>
                </div>
                <div className="text-sm text-gray-300">
                  <span>ERP události: </span>
                  <span className="font-semibold text-purple-400">{erpEventCount}</span>
                </div>
                <button
                  onClick={syncErpEvents}
                  disabled={syncingWithErp}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {syncingWithErp ? 'Synchronizuje se...' : 'Synchronizovat ERP'}
                </button>
                {erpSyncError && (
                  <div className="text-red-400 text-sm mt-2">
                    {erpSyncError}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-300">
                  <span>Outlook integrace:</span>
                  <button
                    onClick={toggleOutlookIntegration}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      outlookEnabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {outlookEnabled ? 'Outlook Zapnuto' : 'Outlook Vypnuto'}
                  </button>
                </div>
                {outlookEnabled && (
                  <>
                    <button
                      onClick={syncMoreOutlookEvents}
                      disabled={syncingWithOutlook}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {syncingWithOutlook ? 'Synchronizuje se...' : 'Synchronizovat'}
                    </button>
                    <div className="relative group">
                      <button className="px-2 py-1 text-gray-400 hover:text-gray-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="mb-1">Pro synchronizaci s Outlook je potřeba:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Přihlášení přes Azure AD</li>
                          <li>Přístup k Outlook kalendáři</li>
                          <li>Platný access token</li>
                        </ul>
                        <p className="mt-2 text-yellow-300">Pokud synchronizace selže, zkuste se znovu přihlásit.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Zobrazit kalendáře - funkce ještě není implementována')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Zobrazit kalendáře
                    </button>
                    <button
                      onClick={() => alert('Informace o uživateli - funkce ještě není implementována')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Informace o uživateli
                    </button>
                    {syncError && (
                      <div className="text-red-400 text-xs mt-1 max-w-xs">
                        {syncError}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>
          
          {/* Event Filter Panel */}
          <EventFilterPanel 
            filters={eventFilters}
            onFiltersChange={setEventFilters}
          />
          
          <Calendar
              localizer={localizer}
              events={filterEvents(events)}
              startAccessor="start"
              endAccessor="end"
              className="w-full"
              style={{ height: 800, width: '100%' }}
              date={currentDate}
              view={Views[currentView.toUpperCase() as keyof typeof Views]}
              onNavigate={(date, view, action) => {
                setCurrentDate(date)
                setCurrentView(view)
              }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: "Další",
                previous: "Předchozí",
                today: "Dnes",
                month: "Měsíc",
                week: "Týden",
                day: "Den",
                agenda: "Seznam",
                date: "Datum",
                time: "Čas",
                event: "Událost",
                noEventsInRange: "Žádné události v tomto období.",
                showMore: (total: number) => {
                  // Custom logic to show correct number
                  const actualEvents = total > 2 ? total - 1 : total
                  return `+${actualEvents} další`
                }
              }}
              formats={{
                weekdayFormat: (date: any) => {
                  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
                  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
                  return days[dayIndex]
                },
                monthHeaderFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
                },
                dayHeaderFormat: (date: any) => {
                  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
                  const dateObj = new Date(date)
                  return days[dateObj.getDay()]
                },
                dayFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.getDate().toString()
                },
                agendaHeaderFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleDateString('cs-CZ', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                },
                agendaTimeRangeFormat: ({ start, end }: { start: any; end: any }) => {
                  const formatTime = (date: any) => {
                    const dateObj = new Date(date)
                    return dateObj.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return `${formatTime(start)} - ${formatTime(end)}`
                },
                agendaDateFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleDateString('cs-CZ', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                },
                timeGutterFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })
                },
                eventTimeRangeFormat: ({ start, end }: { start: any; end: any }) => {
                  const formatTime = (date: any) => {
                    const dateObj = new Date(date)
                    return dateObj.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return `${formatTime(start)} - ${formatTime(end)}`
                },
                eventTimeRangeStartFormat: ({ start }: { start: any }) => {
                  const formatTime = (date: any) => {
                    const dateObj = new Date(date)
                    return dateObj.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return formatTime(start)
                },
                eventTimeRangeEndFormat: ({ end }: { end: any }) => {
                  const formatTime = (date: any) => {
                    const dateObj = new Date(date)
                    return dateObj.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return formatTime(end)
                },
                dateFormat: (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleDateString('cs-CZ', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })
                }
              }}
              components={{
                toolbar: () => (
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
                    {/* Left side - Date Navigation */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateDate('prev')}
                        className="px-3 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        ← Předchozí
                      </button>
                      <button
                        onClick={() => navigateDate('today')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Dnes
                      </button>
                      <button
                        onClick={() => navigateDate('next')}
                        className="px-3 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Další →
                      </button>
                    </div>

                    {/* Center - Date Display */}
                    <div className="text-lg font-semibold text-white">
                      {currentDate.toLocaleDateString('cs-CZ', { 
                        month: 'long', 
                        year: 'numeric',
                        day: currentView === Views.DAY ? 'numeric' : undefined
                      })}
                    </div>

                    {/* Right side - View Switcher */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentView(Views.MONTH)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentView === Views.MONTH ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                      >
                        Měsíc
                      </button>
                      <button
                        onClick={() => setCurrentView(Views.WEEK)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentView === Views.WEEK ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                      >
                        Týden
                      </button>
                      <button
                        onClick={() => setCurrentView(Views.DAY)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentView === Views.DAY ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                      >
                        Den
                      </button>
                      <button
                        onClick={() => setCurrentView(Views.AGENDA)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentView === Views.AGENDA ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                      >
                        Agenda
                      </button>
                    </div>
                  </div>
                ),
                event: ({ event }: { event: CalendarEvent }) => (
                  <div
                    onMouseEnter={(e) => {
                      logger.log('Hover event triggered:', event.title, event.resource?.description)
                      const description = event.resource?.description || ''
                      showTooltip(e, event.title, description)
                    }}
                    onMouseLeave={hideTooltip}
                    style={{
                      backgroundColor: eventStyleGetter(event).style.backgroundColor,
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: 'white',
                      minHeight: '24px',
                      whiteSpace: 'normal',
                      overflow: 'visible',
                      zIndex: 10,
                      lineHeight: '1.3'
                    }}
                  >
                    {event.title}
                  </div>
                ),
                showMore: ({ events }: { events: CalendarEvent[] }) => (
                  <div
                    onMouseEnter={(e) => {
                      logger.log('ShowMore hover triggered:', events.length, events)
                      const eventDetails = events.map(event => 
                        `${event.title}${event.resource?.description ? ': ' + event.resource.description : ''}`
                      ).join('\n')
                      showTooltip(e, `${events.length} událostí`, eventDetails)
                    }}
                    onMouseLeave={hideTooltip}
                    className="rbc-show-more"
                  >
                    +{events.length} více
                  </div>
                )
              }}
            />
        </div>
      </main>
      
      {showModal && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  )
}

// Event Modal Component
function EventModal({ 
  event, 
  onClose, 
  onCreate,
  onDelete, 
  onUpdate 
}: { 
  event: CalendarEvent | null; 
  onClose: () => void; 
  onCreate: (eventData: any) => Promise<void>;
  onUpdate?: (eventData: any) => Promise<void>; 
  onDelete: () => Promise<void> 
}) {
  const { data: session } = useSession()
  const isErpEvent = event?.resource?.isErpEvent
  const isOutlookEvent = event?.id?.startsWith('outlook-')
  const isOwner = session?.user?.email && event?.resource?.id === session.user.id

  const canEdit = !isErpEvent && isOwner
  const canDelete = !isErpEvent && isOwner
  const canEditErp = isErpEvent && session?.user?.role && ['ADMIN', 'IT'].includes(session.user.role)
  const canDeleteErp = isErpEvent && session?.user?.role && ['ADMIN'].includes(session.user.role)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {event?.title || 'Nová událost'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Název</label>
            <input
              type="text"
              value={event?.title || ''}
              onChange={(e) => event && onUpdate?.({ ...event, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Začátek</label>
            <input
              type="datetime-local"
              value={event?.start ? new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => event && onUpdate?.({ ...event, start: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Konec</label>
            <input
              type="datetime-local"
              value={event?.end ? new Date(event.end.getTime() - event.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => event && onUpdate?.({ ...event, end: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Typ</label>
            <select
              value={event?.resource?.type || 'OTHER'}
              onChange={(e) => event && onUpdate?.({ ...event, resource: { ...event.resource, type: e.target.value as any } })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-blue-500 p-2"
              disabled={!canEdit}
            >
              <option value="MEETING">Schůzka</option>
              <option value="OTHER">Ostatní</option>
            </select>
            {canEdit && (
              <p className="text-xs text-gray-500 mt-1">
                Pro lokální události jsou dostupné jen typy "Schůzka" a "Ostatní". 
                ERP události (Upgrade, Patch, Dovolené) se synchronizují automaticky.
              </p>
            )}
          </div>

          {/* ERP specific fields */}
          {isErpEvent && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informace o ERP události</h4>
              
              {event?.resource?.erpProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Projekt</label>
                  <input
                    type="text"
                    value={event.resource.erpProject || ''}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2"
                  />
                </div>
              )}
              
              {event?.resource?.erpJiraKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jira klíč</label>
                  <input
                    type="text"
                    value={event.resource.erpJiraKey || ''}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2"
                  />
                </div>
              )}
              
              {event?.resource?.erpResolver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Řešitel</label>
                  <input
                    type="text"
                    value={event.resource.erpResolver || ''}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2"
                  />
                </div>
              )}
              
              {event?.resource?.erpSystems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Systémy</label>
                  <textarea
                    value={event.resource.erpSystems || ''}
                    readOnly
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Zrušit
            </button>
            
            {(canDelete || canDeleteErp) && (
              <button
                type="button"
                onClick={() => {
                  onDelete?.()
                  onClose()
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Smazat
              </button>
            )}
            
            {(canEdit || canEditErp) && onUpdate && (
              <button
                type="button"
                onClick={() => {
                  if (event) {
                    onUpdate?.(event)
                  }
                  onClose()
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Uložit změny
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Event, CalendarEvent } from '@/types/calendar'
import { OutlookCalendarService } from '@/lib/outlook-calendar'
import { ErpCalendarService } from '@/lib/erp-calendar'

// Custom CSS pro opravu klikání na události
const customStyles = `
  .rbc-event {
    z-index: 10 !important;
    cursor: pointer !important;
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: visible !important;
    line-height: 1.2 !important;
    min-height: 20px !important;
  }
  
  .rbc-event:hover {
    z-index: 15 !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    background-color: rgba(0,0,0,0.9) !important;
  }
  
  .rbc-event.rbc-selected {
    z-index: 20 !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.8);
  }
  
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
    overflow: visible !important;
  }
  
  .rbc-row-content {
    overflow: visible !important;
  }
  
  .rbc-day-slot .rbc-events-container {
    overflow: visible !important;
  }
  
  .rbc-event-content {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: visible !important;
  }
  
  .rbc-toolbar .rbc-btn-group {
    margin-bottom: 10px !important;
  }
  
  .rbc-toolbar button {
    margin-right: 5px !important;
  }
  
  /* České názvy měsíců */
  .rbc-month-view .rbc-header {
    text-transform: capitalize;
  }
  
  .rbc-month-view .rbc-header span {
    font-size: 12px;
    font-weight: 500;
  }
  
  /* Formát času 24h a české zkratky dnů */
  .rbc-time-view .rbc-time-header {
    font-size: 11px;
  }
  
  .rbc-time-view .rbc-time-slot {
    font-size: 11px;
  }
  
  /* České zkratky dnů - přepsání výchozích textů */
  .rbc-header span {
    visibility: hidden !important;
  }
  
  .rbc-header span::after {
    content: attr(data-czech) !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
  }
  
  .rbc-header abbr {
    visibility: hidden !important;
  }
  
  .rbc-header abbr::after {
    content: attr(data-czech) !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
  }
  
  /* Přidání data-czech atributů přes JavaScript */
  .rbc-month-view .rbc-header:nth-child(1) span,
  .rbc-month-view .rbc-header:nth-child(1) abbr {
    data-czech: 'Po' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(2) span,
  .rbc-month-view .rbc-header:nth-child(2) abbr {
    data-czech: 'Út' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(3) span,
  .rbc-month-view .rbc-header:nth-child(3) abbr {
    data-czech: 'St' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(4) span,
  .rbc-month-view .rbc-header:nth-child(4) abbr {
    data-czech: 'Čt' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(5) span,
  .rbc-month-view .rbc-header:nth-child(5) abbr {
    data-czech: 'Pá' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(6) span,
  .rbc-month-view .rbc-header:nth-child(6) abbr {
    data-czech: 'So' !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(7) span,
  .rbc-month-view .rbc-header:nth-child(7) abbr {
    data-czech: 'Ne' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(1) span {
    data-czech: 'Po' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(2) span {
    data-czech: 'Út' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(3) span {
    data-czech: 'St' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(4) span {
    data-czech: 'Čt' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(5) span {
    data-czech: 'Pá' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(6) span {
    data-czech: 'So' !important;
  }
  
  .rbc-time-view .rbc-header:nth-child(7) span {
    data-czech: 'Ne' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(1) span,
  .rbc-day-view .rbc-header:nth-child(1) abbr {
    data-czech: 'Po' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(2) span,
  .rbc-day-view .rbc-header:nth-child(2) abbr {
    data-czech: 'Út' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(3) span,
  .rbc-day-view .rbc-header:nth-child(3) abbr {
    data-czech: 'St' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(4) span,
  .rbc-day-view .rbc-header:nth-child(4) abbr {
    data-czech: 'Čt' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(5) span,
  .rbc-day-view .rbc-header:nth-child(5) abbr {
    data-czech: 'Pá' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(6) span,
  .rbc-day-view .rbc-header:nth-child(6) abbr {
    data-czech: 'So' !important;
  }
  
  .rbc-day-view .rbc-header:nth-child(7) span,
  .rbc-day-view .rbc-header:nth-child(7) abbr {
    data-czech: 'Ne' !important;
  }
  
  /* Formát času 24h pro všechny zobrazení */
  .rbc-time-slot,
  .rbc-time-header,
  .rbc-time-gutter,
  .rbc-time-content {
    font-size: 11px !important;
  }
  
  .rbc-time-slot {
    text-align: center !important;
  font-family: monospace !important;
  }
  
  .rbc-time-header {
    text-align: center !important;
    font-family: monospace !important;
  }
  
  /* Zvýšení výšky řádků v měsíčním zobrazení */
  .rbc-month-view .rbc-row {
    min-height: 80px !important;
  }
  
  .rbc-month-view .rbc-row-segment {
    min-height: 80px !important;
  }
  
  .rbc-month-view .rbc-day-bg {
    min-height: 80px !important;
  }
  
  /* Styl pro "+N more" */
  .rbc-show-more {
    background: #3b82f6 !important;
    color: white !important;
    border-radius: 4px !important;
    padding: 2px 6px !important;
    font-size: 11px !important;
    cursor: pointer !important;
    z-index: 25 !important;
    position: relative !important;
    margin: 2px !important;
  }
  
  .rbc-show-more:hover {
    background: #2563eb !important;
    transform: scale(1.05) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
  }
  
  /* Větší prostor pro události */
  .rbc-month-view .rbc-event {
    margin-bottom: 2px !important;
    padding: 2px 4px !important;
    font-size: 11px !important;
    line-height: 1.1 !important;
  }
`

import { format, parse, startOfWeek, getDay } from 'date-fns'
import { cs } from 'date-fns/locale'

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

// Event styling function
const eventStyleGetter = (event: CalendarEvent) => {
  const isOutlookEvent = event.id.startsWith('outlook-')
  const isErpEvent = event.resource?.isErpEvent
  
  const baseColor = {
    PROJECT: '#3b82f6', // blue-500
    MEETING: '#f97316', // orange-500
    HOLIDAY: '#10b981', // emerald-500
    OTHER: '#6b7280', // gray-500
    ERP_UPGRADE: '#8b5cf6', // violet-500
    ERP_PATCH: '#f59e0b', // amber-500
  }[event.resource.type] || '#6b7280'
  
  const backgroundColor = isOutlookEvent ? '#0078d4' : 
                      isErpEvent ? baseColor : 
                      baseColor
  
  return {
    style: {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: isOutlookEvent ? '2px solid #0078d4' : 
             isErpEvent ? '2px solid #8b5cf6' : 
             '0px',
      display: 'block',
      fontSize: isOutlookEvent ? '12px' : '14px',
      padding: '6px 8px',
      margin: '1px 0',
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
  const [userRole, setUserRole] = useState<string>('')
  
  // Calendar refs
  const calendarRef = useRef<Calendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState(Views.MONTH)
  
  // Apply custom styles and add data-czech attributes
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = customStyles
    document.head.appendChild(style)
    
    // Aplikovat po načtení DOM a při změně zobrazení
    const addCzechAttributes = () => {
      const headers = document.querySelectorAll('.rbc-header')
      const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
      
      headers.forEach((header, index) => {
        const dayIndex = (index + 1) % 7 || 7
        header.setAttribute('data-czech', days[dayIndex - 1])
      })
    }
    
    // Aplikovat po načtení DOM
    setTimeout(() => {
      addCzechAttributes()
    }, 100)
    
    // Sledovat změny zobrazení a re-aplikovat atributy
    const observer = new MutationObserver(() => {
      setTimeout(addCzechAttributes, 50)
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    return () => {
      document.head.removeChild(style)
      observer.disconnect()
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

  const changeView = (view: typeof Views) => {
    setCurrentView(view)
    if (calendarRef.current) {
      calendarRef.current.changeView(view)
    }
  }

  // Session check
  useEffect(() => {
    console.log('Calendar - Session status:', status)
    console.log('Calendar - Session data:', session)
    
    if (status === 'loading') {
      return // Čekáme na session
    }
    
    if (status === 'unauthenticated') {
      console.log('Calendar - User not authenticated, redirecting to login')
      router.push('/login')
      return
    }
    
    if (session?.user) {
      setUserRole(session.user.role || '')
      console.log('Calendar - User authenticated:', session.user.email, 'Role:', session.user.role)
    }
    
    setLoading(false)
  }, [session, status, router])

  const fetchEvents = async () => {
    console.log('fetchEvents: Starting fetch')
    try {
      const response = await fetch('/api/events')
      console.log('fetchEvents: Response status:', response.status)
      
      if (response.ok) {
        const data: Event[] = await response.json()
        console.log('fetchEvents: Raw data:', data)
        console.log('fetchEvents: Data length:', data.length)
        
        const calendarEvents: CalendarEvent[] = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          allDay: event.allDay,
          resource: event,
        }))
        
        console.log('fetchEvents: Mapped events:', calendarEvents)
        setEvents(calendarEvents)

        // Update ERP event count
        const erpEvents = data.filter(event => event.isErpEvent)
        console.log('fetchEvents: ERP events count:', erpEvents.length)
        setErpEventCount(erpEvents.length)
      } else {
        console.error('fetchEvents: Response not OK:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setShowModal(true)
  }

  const handleCreateEvent = async (eventData: Partial<Event>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents()
        setShowModal(false)
        setSelectedEvent(null)
        setSelectedSlot(null)
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    if (!selectedEvent) return

    // Zabrání editace Outlook událostí
    if (selectedEvent.resource?.isOutlookEvent) {
      alert('Outlook události nelze editovat z portálu. Prosím, upravte je přímo v Outlooku.')
      return
    }

    // Zabrání editace ERP událostí bez oprávnění
    if (selectedEvent.resource?.isErpEvent) {
      if (userRole !== 'ADMIN' && userRole !== 'IT' && userRole !== 'MANAGER') {
        alert('ERP události mohou editovat pouze uživatelé s oprávněním (ADMIN, IT, MANAGER).')
        return
      }
    }

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents()
        setShowModal(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    
    // Zabrání mazání Outlook událostí
    if (selectedEvent.resource?.isOutlookEvent) {
      alert('Outlook události nelze mazat z portálu. Prosím, smažte je přímo v Outlooku.')
      return
    }

    // Zabrání mazání ERP událostí bez oprávnění
    if (selectedEvent.resource?.isErpEvent) {
      if (userRole !== 'ADMIN' && userRole !== 'IT') {
        alert('ERP události mohou mazat pouze uživatelé s oprávněním (ADMIN, IT).')
        return
      }
    }

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
      console.error('Error deleting event:', error)
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
      const outlookEvents = await OutlookCalendarService.getEvents()
      const calendarEvents: CalendarEvent[] = outlookEvents.map((outlookEvent) => {
        const startDate = new Date(outlookEvent.start.dateTime)
        const endDate = new Date(outlookEvent.end.dateTime)
        
        return {
          id: `outlook-${outlookEvent.id}`,
          title: outlookEvent.subject,
          start: startDate,
          end: endDate,
          allDay: false,
          resource: {
            type: 'MEETING',
            outlookId: outlookEvent.id,
          },
        }
      })

      // Save to database
      for (const calendarEvent of calendarEvents) {
        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: calendarEvent.title,
              startDate: calendarEvent.start,
              endDate: calendarEvent.end,
              type: 'MEETING',
              allDay: false,
              outlookId: calendarEvent.id,
            }),
          })

          if (response.ok) {
            setOutlookEventCount(prev => prev + 1)
          }
        } catch (error) {
          console.error('Error saving Outlook event:', error)
        }
      }

      await fetchEvents()
    } catch (error) {
      setSyncError('Failed to sync Outlook events')
    } finally {
      setSyncingWithOutlook(false)
    }
  }

  const syncErpEvents = async () => {
    setSyncingWithErp(true)
    setErpSyncError(null)

    try {
      const result = await fetch('/api/erp-calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const syncResult = await result.json()
      console.log('ERP Sync result:', syncResult)
      
      // Refresh events after sync
      await fetchEvents()
      
      // Update ERP event count
      const erpResponse = await fetch('/api/erp-calendar')
      if (erpResponse.ok) {
        const erpData = await erpResponse.json()
        setErpEventCount(erpData.length)
      }
    } catch (error) {
      setErpSyncError('Sync failed: ' + (error as Error).message)
    } finally {
      setSyncingWithErp(false)
    }
  }

  // Load events on component mount
  useEffect(() => {
    if (session) {
      fetchEvents()
      // Check if Outlook integration is enabled
      setOutlookEnabled(OutlookCalendarService.hasOutlookIntegration())
      // Set user role
      setUserRole(session.user.role || '')
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center">
          {/* Odstraněn název "Kalendář" - je v horní hlavičce portálu */}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              <span>ERP události: </span>
              <span className="font-semibold text-purple-600">{erpEventCount}</span>
            </div>
            <button
              onClick={syncErpEvents}
              disabled={syncingWithErp}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {syncingWithErp ? 'Synchronizuje se...' : 'Synchronizovat ERP'}
            </button>
            {erpSyncError && (
              <div className="text-red-500 text-sm mt-2">
                {erpSyncError}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              <span>Přihlášen jako: </span>
              <span className="font-semibold">{session?.user?.email}</span>
              {userRole && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {userRole}
                </span>
              )}
            </div>
            <button
              onClick={toggleOutlookIntegration}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                outlookEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {outlookEnabled ? 'Outlook Zapnuto' : 'Outlook Vypnuto'}
            </button>
            {outlookEnabled && (
              <button
                onClick={syncMoreOutlookEvents}
                disabled={syncingWithOutlook}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {syncingWithOutlook ? 'Synchronizuje se...' : 'Synchronizovat'}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-4" style={{ minHeight: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            date={currentDate}
            view={currentView}
            onNavigate={(date, view, action) => {
              setCurrentDate(date)
              setCurrentView(view)
            }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: () => (
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Left side - Date Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateDate('prev')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      ← Předchozí
                    </button>
                    <button
                      onClick={() => navigateDate('today')}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Dnes
                    </button>
                    <button
                      onClick={() => navigateDate('next')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Další →
                    </button>
                  </div>
                  
                  {/* Center - Month/Year display with year navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate)
                        newDate.setFullYear(newDate.getFullYear() - 1)
                        setCurrentDate(newDate)
                      }}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      «
                    </button>
                    <span className="px-3 py-1 font-semibold text-gray-900">
                      {currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => {
                        const newDate = new Date(currentDate)
                        newDate.setFullYear(newDate.getFullYear() + 1)
                        setCurrentDate(newDate)
                      }}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      »
                    </button>
                  </div>
                  
                  {/* Right side - View Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changeView(Views.MONTH)}
                      className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                        currentView === Views.MONTH ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Měsíc
                    </button>
                    <button
                      onClick={() => changeView(Views.WEEK)}
                      className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                        currentView === Views.WEEK ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Týden
                    </button>
                    <button
                      onClick={() => changeView(Views.DAY)}
                      className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                        currentView === Views.DAY ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Den
                    </button>
                    <button
                      onClick={() => changeView(Views.AGENDA)}
                      className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                        currentView === Views.AGENDA ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Seznam
                    </button>
                  </div>
                </div>
              ),
              messages: {
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
                showMore: (total: number) => `+${total} další`
              },
              formats: {
                weekdayFormat: (date: Date, culture: string, localizer: any) => {
                  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
                  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
                  return days[dayIndex]
                },
                monthHeaderFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
                },
                dayHeaderFormat: (date: Date, culture: string, localizer: any) => {
                  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
                  return days[date.getDay()]
                },
                dayFormat: (date: Date, culture: string, localizer: any) => {
                  return date.getDate().toString()
                },
                agendaHeaderFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleDateString('cs-CZ', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                },
                agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: string, localizer: any) => {
                  const formatTime = (date: Date) => {
                    return date.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return `${formatTime(start)} - ${formatTime(end)}`
                },
                agendaDateFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleDateString('cs-CZ', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                },
                timeGutterFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })
                },
                selectRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: string, localizer: any) => {
                  const formatDate = (date: Date) => {
                    return date.toLocaleDateString('cs-CZ', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })
                  }
                  return `${formatDate(start)} - ${formatDate(end)}`
                },
                eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: string, localizer: any) => {
                  const formatTime = (date: Date) => {
                    return date.toLocaleTimeString('cs-CZ', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                  return `${formatTime(start)} - ${formatTime(end)}`
                },
                eventTimeRangeStartFormat: ({ start }: { start: Date }, culture: string, localizer: any) => {
                  return start.toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })
                },
                eventTimeRangeEndFormat: ({ end }: { end: Date }, culture: string, localizer: any) => {
                  return end.toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })
                },
                dateFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleDateString('cs-CZ', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })
                },
                timeFormat: (date: Date, culture: string, localizer: any) => {
                  return date.toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })
                }
              }
            }}
          />
        </div>
      </main>
      
      {/* Event Modal */}
      {showModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowModal(false)
            setSelectedEvent(null)
          }}
          onDelete={handleDeleteEvent}
          onUpdate={() => {
            // TODO: Implement update functionality
            console.log('Update event:', selectedEvent)
          }}
        />
      )}
      
      {/* Create Event Modal */}
      {showModal && selectedSlot && !selectedEvent && (
        <EventModal
          event={null}
          onClose={() => {
            setShowModal(false)
            setSelectedSlot(null)
          }}
          onDelete={() => {}}
          onUpdate={() => {
            // TODO: Implement create functionality
            console.log('Create event for slot:', selectedSlot)
          }}
        />
      )}
    </div>
  )
}

// Event Modal Component
function EventModal({ 
  event, 
  onClose, 
  onDelete, 
  onUpdate 
}: { 
  event: CalendarEvent | null; 
  onClose: () => void; 
  onDelete: () => void; 
  onUpdate?: () => void 
}) {
  const { data: session } = useSession()
  const isErpEvent = event?.resource?.isErpEvent
  const isOutlookEvent = event?.id?.startsWith('outlook-')
  const isOwner = session?.user?.email && event?.resource?.ownerId === session.user.email

  const canEdit = !isErpEvent && !isOutlookEvent && isOwner
  const canDelete = !isErpEvent && !isOutlookEvent && isOwner
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {event?.title}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {event?.resource?.description || 'Bez popisu'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Místo konání</label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {event?.resource?.location || 'Neuvedeno'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {isOutlookEvent ? 'Outlook událost' : 
               isErpEvent ? (event?.resource?.type === 'ERP_UPGRADE' ? 'Upgrade' : 'Patchování') : 
               event?.resource?.type || 'Ostatní'}
            </div>
          </div>

          {/* ERP specific fields */}
          {isErpEvent && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informace o ERP události</h4>
              
              {event?.resource?.erpProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projekt</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {event.resource.erpProject}
                  </div>
                </div>
              )}
              
              {event?.resource?.erpJiraKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jira klíč</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {event.resource.erpJiraKey}
                  </div>
                </div>
              )}
              
              {event?.resource?.erpResolver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Řešitel</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {event.resource.erpResolver}
                  </div>
                </div>
              )}
              
              {event?.resource?.erpSystems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Systémy</label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {event.resource.erpSystems}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outlook specific fields */}
          {isOutlookEvent && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informace o Outlook události</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizátor</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  {event?.resource?.organizer || 'Neuvedeno'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Místo konání</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  {event?.resource?.location || 'Neuvedeno'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  Outlook událost
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Zavřít
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
                  onUpdate?.()
                  onClose()
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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

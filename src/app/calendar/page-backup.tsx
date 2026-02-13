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
`

// Setup localizer
const locales = {
  'cs': cs,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
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
  
  // Apply custom styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = customStyles
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
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
      console.error('Error creating event:', error)
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
      console.error('Error updating event:', error)
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
    <div className="flex h-screen bg-gray-50">
      <div className="flex h-full w-64 flex-col bg-gray-50">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold text-gray-900">Firma Portal</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/dashboard">
            <span className="mr-3 text-lg">📊</span>
            Dashboard
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/plan_patchovani">
            <span className="mr-3 text-lg">📁</span>
            Přehled patchování
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/evidence-projektu">
            <span className="mr-3 text-lg">🗂️</span>
            Evidence projektů
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/upgrades">
            <span className="mr-3 text-lg">🚀</span>
            Upgrady
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/databases">
            <span className="mr-3 text-lg">🗄️</span>
            Aktuální stav databází
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/grafy/db-size">
            <span className="mr-3 text-lg">📈</span>
            Grafy
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/dashboard/mapa">
            <span className="mr-3 text-lg">🗺️</span>
            Mapa poboček
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-blue-100 text-blue-700" href="/calendar">
            <span className="mr-3 text-lg">📅</span>
            Kalendář
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/users">
            <span className="mr-3 text-lg">👥</span>
            Uživatelé
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/settings">
            <span className="mr-3 text-lg">⚙️</span>
            Nastavení
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/settings/roles">
            <span className="mr-3 text-lg">🔐</span>
            Správa rolí
          </a>
          <a className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900" href="/settings/hwsw">
            <span className="mr-3 text-lg">💻</span>
            HW/SW Konfigurace
          </a>
        </nav>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">Vítejte, {session?.user?.name || 'Uživateli'}</h2>
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
                <span>Outlook integrace:</span>
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
              </div>
              {outlookEnabled && (
                <>
                  <button
                    onClick={syncMoreOutlookEvents}
                    disabled={syncingWithOutlook}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {syncingWithOutlook ? 'Synchronizuje se...' : 'Synchronizovat'}
                  </button>
                  <button
                    onClick={() => alert('Zobrazit kalendáře - funkce ještě není implementována')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Zobrazit kalendáře
                  </button>
                  <button
                    onClick={() => alert('Informace o uživateli - funkce ještě není implementována')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Informace o uživateli
                  </button>
                </>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Odhlásit se
              </button>
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
                    
                    {/* Center - Month/Year display */}
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 font-semibold text-gray-900">
                        {currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
                      </span>
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
                        Agenda
                      </button>
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </main>
      </div>
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
  const isOwner = session?.user?.email && event?.resource?.ownerId === session.user.id

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
              onChange={(e) => onUpdate?.({ ...event, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Začátek</label>
            <input
              type="datetime-local"
              value={event?.start ? new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate?.({ ...event, start: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Konec</label>
            <input
              type="datetime-local"
              value={event?.end ? new Date(event.end.getTime() - event.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate?.({ ...event, end: new Date(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              readOnly={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Typ</label>
            <select
              value={event?.resource?.type || 'OTHER'}
              onChange={(e) => onUpdate?.({ ...event, resource: { ...event.resource, type: e.target.value as any } })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              disabled={!canEdit}
            >
              <option value="PROJECT">Projekt</option>
              <option value="MEETING">Schůzka</option>
              <option value="HOLIDAY">Svátek</option>
              <option value="OTHER">Ostatní</option>
              <option value="ERP_UPGRADE">ERP Upgrade</option>
              <option value="ERP_PATCH">ERP Patch</option>
            </select>
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

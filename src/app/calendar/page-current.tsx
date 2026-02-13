'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer, Views, Navigate, DateLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from '@/types/calendar'
import { ErpCalendarService } from '@/lib/erp-calendar'
import { OutlookCalendarService } from '@/lib/outlook-calendar'
import { cn } from '@/lib/utils'

// Setup localizer s českou lokalizací
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

// Custom CSS pro české zkratky dnů a 24h formát
const customStyles = `
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
  
  /* Formát času 24h a české zkratky dnů */
  .rbc-time-view .rbc-time-header {
    font-size: 11px;
  }
  
  .rbc-time-view .rbc-time-slot {
    font-size: 11px;
  }
  
  /* České zkratky dnů v týdenním zobrazení */
  .rbc-time-header .rbc-header > span {
    visibility: hidden !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(1) > span::after {
    content: 'Po' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(2) > span::after {
    content: 'Út' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(3) > span::after {
    content: 'St' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(4) > span::after {
    content: 'Čt' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(5) > span::after {
    content: 'Pá' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(6) > span::after {
    content: 'So' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-time-header .rbc-header:nth-child(7) > span::after {
    content: 'Ne' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  /* České zkratky dnů v měsíčním zobrazení */
  .rbc-month-view .rbc-header abbr {
    visibility: hidden !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(1) abbr::after {
    content: 'Po' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(2) abbr::after {
    content: 'Út' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(3) abbr::after {
    content: 'St' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(4) abbr::after {
    content: 'Čt' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(5) abbr::after {
    content: 'Pá' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(6) abbr::after {
    content: 'So' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }
  
  .rbc-month-view .rbc-header:nth-child(7) abbr::after {
    content: 'Ne' !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
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
`

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
      fontSize: isOutlookEvent ? '12px' : '14px'
    }
  }
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'test-1',
      title: 'Testovací událost',
      start: new Date(),
      end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
      allDay: false,
      resource: {
        id: 'test-resource-1',
        title: 'Testovací událost',
        description: 'Testovací událost pro kalendář',
        type: 'MEETING',
        allDay: false,
        start: new Date(),
        end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
      }
    }
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [outlookEnabled, setOutlookEnabled] = useState(false)
  const [syncingWithOutlook, setSyncingWithOutlook] = useState(false)
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
    
    // Force reflow to ensure styles are applied
    setTimeout(() => {
      const calendar = document.querySelector('.rbc-calendar') as HTMLElement
      const monthView = document.querySelector('.rbc-month-view') as HTMLElement
      const timeView = document.querySelector('.rbc-time-view') as HTMLElement
      
      if (calendar) {
        calendar.style.display = 'block'
        calendar.style.visibility = 'visible'
      }
      
      if (monthView) {
        monthView.style.display = 'block'
        monthView.style.visibility = 'visible'
      }
      
      if (timeView) {
        timeView.style.display = 'block'
        timeView.style.visibility = 'visible'
      }
    }, 100)
    
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
        newDate.setHours(0, 0, 0, 0)
        break
    }
    setCurrentDate(newDate)
  }

  const changeView = (view: typeof Views) => {
    setCurrentView(view)
  }

  // Fetch ERP events
  const syncErpEvents = async () => {
    try {
      setSyncingWithErp(true)
      setErpSyncError(null)
      
      const erpEvents = await ErpCalendarService.getErpEvents()
      setEvents(prev => [...prev, ...erpEvents] as CalendarEvent[])
      setErpEventCount(erpEvents.length)
      
    } catch (error) {
      console.error('Error syncing ERP events:', error)
      setErpSyncError('Nepodařilo se synchronizovat ERP události')
    } finally {
      setSyncingWithErp(false)
    }
  }

  // Fetch Outlook events
  const syncOutlookEvents = async () => {
    try {
      setSyncingWithOutlook(true)
      
      const outlookEvents = await OutlookCalendarService.fetchOutlookEvents()
      setEvents(prev => [...prev, ...outlookEvents] as CalendarEvent[])
      
    } catch (error) {
      console.error('Error syncing Outlook events:', error)
    } finally {
      setSyncingWithOutlook(false)
    }
  }

  const syncMoreOutlookEvents = async () => {
    try {
      setSyncingWithOutlook(true)
      
      const moreEvents = await OutlookCalendarService.fetchMoreOutlookEvents()
      setEvents(prev => [...prev, ...moreEvents] as CalendarEvent[])
      
    } catch (error) {
      console.error('Error syncing more Outlook events:', error)
    } finally {
      setSyncingWithOutlook(false)
    }
  }

  const toggleOutlookIntegration = () => {
    setOutlookEnabled(!outlookEnabled)
  }

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedEvent(null)
  }

  const handleCreateEvent = (eventData: Partial<CalendarEvent>) => {
    // TODO: Implement event creation
    console.log('Create event:', eventData)
    handleCloseModal()
  }

  const handleUpdateEvent = (eventData: CalendarEvent) => {
    // TODO: Implement event update
    console.log('Update event:', eventData)
    handleCloseModal()
  }

  const handleDeleteEvent = (eventId: string) => {
    // TODO: Implement event deletion
    console.log('Delete event:', eventId)
    handleCloseModal()
  }

  // Check user role for permissions
  useEffect(() => {
    if (session?.user?.email) {
      // Extract role from email or user metadata
      const email = session.user.email
      if (email?.includes('admin')) {
        setUserRole('ADMIN')
      } else if (email?.includes('it')) {
        setUserRole('IT')
      } else if (email?.includes('manager')) {
        setUserRole('MANAGER')
      } else {
        setUserRole('USER')
      }
    }
  }, [session])

  return (
    <div className="flex h-full bg-gray-50">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-4" style={{ minHeight: '600px' }}>
          <header className="flex h-16 items-center justify-between border-b bg-white px-6">
            <div className="flex items-center">
              {/* Odstraněn název "Kalendář" - je v horní hlavičce portálu */}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={syncErpEvents}
                  disabled={syncingWithErp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {syncingWithErp ? 'Synchronizuje se...' : 'Synchronizovat ERP'}
                </button>
                {erpEventCount > 0 && (
                  <span className="text-sm text-gray-600">
                    ({erpEventCount} událostí)
                  </span>
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
          <Calendar
            ref={calendarRef}
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            styleGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            view={currentView}
            date={currentDate}
            onNavigate={navigateDate}
            onView={changeView}
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
              showMore: (total: number) => `+${total} další`
            }}
            formats={{
              weekdayFormat: (date: Date) => {
                const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
                const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
                return days[dayIndex]
              },
              monthHeaderFormat: (date: Date) => {
                return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
              },
              dayHeaderFormat: (date: Date) => {
                const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
                return days[date.getDay()]
              },
              dayFormat: (date: Date) => {
                return date.getDate().toString()
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
              selectRangeFormat: ({ start, end }: { start: any; end: any }) => {
                const formatDate = (date: any) => {
                  const dateObj = new Date(date)
                  return dateObj.toLocaleDateString('cs-CZ', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })
                }
                return `${formatDate(start)} - ${formatDate(end)}`
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
                const dateObj = new Date(start)
                return dateObj.toLocaleTimeString('cs-CZ', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              },
              eventTimeRangeEndFormat: ({ end }: { end: any }) => {
                const dateObj = new Date(end)
                return dateObj.toLocaleTimeString('cs-CZ', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              },
              dateFormat: (date: any) => {
                const dateObj = new Date(date)
                return dateObj.toLocaleDateString('cs-CZ', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })
              },
              timeFormat: (date: any) => {
                const dateObj = new Date(date)
                return dateObj.toLocaleTimeString('cs-CZ', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
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
            }}
          />
        </div>
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { Event, CalendarEvent } from '@/types/calendar'
import { OutlookCalendarService } from '@/lib/outlook-calendar'
import EventFilterPanel from '@/components/EventFilterPanel'
import FullCalendarView from '@/app/calendar/FullCalendarView'
import { getEventCategoryForFilter, SOURCE_COLORS } from '@/lib/calendar-event-tokens'
import { logger } from '@/lib/logger'
import '@/app/calendar/calendar.css'

const Views = { MONTH: 'month', WEEK: 'week', DAY: 'day', AGENDA: 'agenda' } as const

export interface KalenderClientProps {
  userRole: string
  outlookAvailable: boolean
}

type EventFilters = {
  showLocal: boolean
  showErp: boolean
  showOutlook: boolean
  categories: {
    MEETING: boolean
    OTHER: boolean
    ERP_UPGRADE: boolean
    ERP_PATCH: boolean
    ERP_ABSENCE: boolean
  }
}

function formatEventDateRange(event: Pick<CalendarEvent, 'start' | 'end' | 'allDay'>): string {
  const { start, end, allDay } = event
  const hasStart = start instanceof Date && !Number.isNaN(start.getTime())
  const hasEnd = end instanceof Date && !Number.isNaN(end.getTime())

  if (!hasStart && !hasEnd) {
    return 'Bez data'
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  if (allDay) {
    if (hasStart && hasEnd && start.toDateString() !== end.toDateString()) {
      const from = start.toLocaleDateString('cs-CZ', dateOptions)
      const to = end.toLocaleDateString('cs-CZ', dateOptions)
      return `${from} – ${to} (celý den)`
    }
    if (hasStart) {
      const from = start.toLocaleDateString('cs-CZ', dateOptions)
      return `${from} (celý den)`
    }
    if (hasEnd) {
      const to = end.toLocaleDateString('cs-CZ', dateOptions)
      return `${to} (celý den)`
    }
  }

  if (hasStart && hasEnd) {
    const sameDay = start.toDateString() === end.toDateString()
    if (sameDay) {
      const d = start.toLocaleDateString('cs-CZ', dateOptions)
      const tFrom = start.toLocaleTimeString('cs-CZ', timeOptions)
      const tTo = end.toLocaleTimeString('cs-CZ', timeOptions)
      return `${d} ${tFrom} – ${tTo}`
    }
    const from = start.toLocaleString('cs-CZ')
    const to = end.toLocaleString('cs-CZ')
    return `${from} – ${to}`
  }

  if (hasStart) {
    return start.toLocaleString('cs-CZ')
  }
  if (hasEnd) {
    return end.toLocaleString('cs-CZ')
  }

  return 'Bez data'
}

function HlavickaKalendare(props: {
  localCount: number
  erpCount: number
  outlookCount: number
  syncingErp: boolean
  erpError: string | null
  onSyncErp: () => void
  outlookAvailable: boolean
  outlookEnabled: boolean
  syncingOutlook: boolean
  outlookError: string | null
  onToggleOutlook: () => void
  onSyncOutlook: () => void
}) {
  const {
    localCount,
    erpCount,
    outlookCount,
    syncingErp,
    erpError,
    onSyncErp,
    outlookAvailable,
    outlookEnabled,
    syncingOutlook,
    outlookError,
    onToggleOutlook,
    onSyncOutlook,
  } = props

  return (
    <header className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Kalendář událostí
          </h1>
          <p className="text-sm text-gray-400 leading-snug">
            Sjednocený přehled ERP, lokálních a Outlook událostí v jednom kalendáři.
          </p>
          <div className="flex flex-wrap gap-3 pt-1 text-sm">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS.local }} />
              <span>Lokální</span>
              <span className="font-semibold tabular-nums" style={{ color: SOURCE_COLORS.local }}>{localCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS.erp }} />
              <span>ERP</span>
              <span className="font-semibold tabular-nums" style={{ color: SOURCE_COLORS.erp }}>{erpCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS.outlook }} />
              <span>Outlook</span>
              <span className="font-semibold tabular-nums" style={{ color: SOURCE_COLORS.outlook }}>{outlookCount}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onSyncErp}
              disabled={syncingErp}
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-md bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 disabled:bg-slate-500/60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              {syncingErp ? 'Synchronizuje se ERP…' : 'Synchronizovat ERP'}
            </button>
            <div className="inline-flex items-center gap-2">
              <div className="text-xs text-gray-400">Outlook integrace</div>
              <button
                type="button"
                onClick={outlookAvailable ? onToggleOutlook : undefined}
                disabled={!outlookAvailable}
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  outlookEnabled
                    ? 'bg-sky-700 text-white hover:bg-sky-600 disabled:bg-sky-700/40'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-700/60 disabled:text-gray-500'
                }`}
              >
                {outlookAvailable
                  ? outlookEnabled
                    ? 'Outlook zapnuto'
                    : 'Outlook vypnuto'
                  : 'Outlook nedostupný'}
              </button>
              {outlookEnabled && outlookAvailable && (
                <button
                  type="button"
                  onClick={onSyncOutlook}
                  disabled={syncingOutlook}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-sky-900 border border-sky-500/40 text-sky-100 text-xs font-medium hover:bg-sky-800 disabled:bg-sky-900 disabled:border-sky-800 disabled:cursor-not-allowed"
                >
                  {syncingOutlook ? 'Synchronizuje se…' : 'Synchronizovat Outlook'}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1 text-xs max-w-xs text-right">
            {!outlookAvailable && (
              <p className="text-amber-200/90">
                Pro integraci Outlook kalendáře se přihlaste přes Azure AD. ERP a lokální události
                jsou dostupné i bez Outlooku.
              </p>
            )}
            {erpError && <p className="text-red-300">{erpError}</p>}
            {outlookError && <p className="text-red-300">{outlookError}</p>}
          </div>
        </div>
      </div>
    </header>
  )
}

function FiltryKalendare(props: {
  filters: EventFilters
  onFiltersChange: (next: EventFilters) => void
}) {
  const { filters, onFiltersChange } = props

  return (
    <section className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5">
      <EventFilterPanel filters={filters} onFiltersChange={onFiltersChange} />
    </section>
  )
}

function KalenderToolbar(props: {
  currentDate: Date
  currentView: string
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onViewChange: (view: (typeof Views)[keyof typeof Views]) => void
}) {
  const { currentDate, currentView, onNavigate, onViewChange } = props

  const formattedLabel = currentDate.toLocaleDateString('cs-CZ', {
    month: 'long',
    year: 'numeric',
    day: currentView === Views.DAY ? 'numeric' : undefined,
  })

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('prev')}
          className="px-3 py-1 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 transition-colors text-xs font-medium"
        >
          ← Předchozí
        </button>
        <button
          type="button"
          onClick={() => onNavigate('today')}
          className="px-3 py-1  bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors text-xs font-medium"
        >
          Dnes
        </button>
        <button
          type="button"
          onClick={() => onNavigate('next')}
          className="px-3 py-1 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 transition-colors text-xs font-medium"
        >
          Další →
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="text-sm font-semibold text-white mr-1">{formattedLabel}</span>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-md bg-gray-900/60 border border-gray-700/70 px-1.5 py-1.5">
          <button
            type="button"
            onClick={() => onViewChange(Views.MONTH)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              currentView === Views.MONTH
                ? 'bg-slate-600 text-white border border-slate-400/60'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            Měsíc
          </button>
          <button
            type="button"
            onClick={() => onViewChange(Views.WEEK)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              currentView === Views.WEEK
                ? 'bg-slate-600 text-white border border-slate-400/60'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            Týden
          </button>
          <button
            type="button"
            onClick={() => onViewChange(Views.DAY)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              currentView === Views.DAY
                ? 'bg-slate-600 text-white border border-slate-400/60'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            Den
          </button>
          <button
            type="button"
            onClick={() => onViewChange(Views.AGENDA)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              currentView === Views.AGENDA
                ? 'bg-slate-600 text-white border border-slate-400/60'
                : 'text-gray-200 hover:bg-gray-800'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    </div>
  )
}

function PanelUdalosti(props: {
  event: CalendarEvent | null
}) {
  const { data: session } = useSession()
  const event = props.event

  if (!event) {
    return (
      <aside className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5 h-full">
        <div className="text-sm text-gray-300">
          Vyberte událost z kalendáře pro zobrazení detailu.
        </div>
      </aside>
    )
  }

  const isErpEvent = event.resource?.isErpEvent
  const isOutlookEvent = event.id.startsWith('outlook-') || event.resource?.isOutlookEvent
  const isLocalEvent = !isErpEvent && !isOutlookEvent

  const sourceLabel = isErpEvent ? 'ERP' : isOutlookEvent ? 'Outlook' : 'Lokální'
  const sourceColor = isErpEvent ? SOURCE_COLORS.erp : isOutlookEvent ? SOURCE_COLORS.outlook : SOURCE_COLORS.local
  const sourceTone = {
    backgroundColor: `${sourceColor}20`,
    borderColor: `${sourceColor}50`,
    color: `${sourceColor}e8`,
  }

  const canEditErp = isErpEvent && session?.user?.role && ['ADMIN', 'IT'].includes(session.user.role)
  const isOwner =
    session?.user?.id && event.resource && (event.resource as any).ownerId === session.user.id
  const canEditLocal = isLocalEvent && isOwner

  return (
    <aside className="card-professional rounded-lg border border-gray-700/60 p-4 md:p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{event.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatEventDateRange(event)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
            style={sourceTone}
          >
            {sourceLabel}
          </span>
          {isErpEvent && event.resource?.erpEventTypeLabel && (
            <span className="text-[11px] text-gray-400">
              {event.resource.erpEventTypeLabel}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3 text-xs text-gray-300 flex-1 overflow-y-auto">
        {event.resource?.description && (
          <div>
            <div className="text-gray-400 mb-0.5">Popis</div>
            <div className="text-gray-200 whitespace-pre-wrap">{event.resource.description}</div>
          </div>
        )}
        {isErpEvent && (
          <div className="border-t border-gray-700/60 pt-3 space-y-1.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              ERP informace
            </div>
            {event.resource.erpProject && (
              <div>
                <div className="text-gray-400">Projekt</div>
                <div className="font-mono text-[11px] text-gray-200">{event.resource.erpProject}</div>
              </div>
            )}
            {event.resource.erpJiraKey && (
              <div>
                <div className="text-gray-400">Jira klíč</div>
                <div className="font-mono text-[11px] text-gray-200">{event.resource.erpJiraKey}</div>
              </div>
            )}
            {event.resource.erpResolver && (
              <div>
                <div className="text-gray-400">Řešitel</div>
                <div className="text-gray-200">{event.resource.erpResolver}</div>
              </div>
            )}
            {event.resource.erpSystems && (
              <div>
                <div className="text-gray-400 mb-0.5">Systémy</div>
                <div className="text-gray-200 whitespace-pre-wrap">
                  {event.resource.erpSystems}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="pt-3 mt-3 border-t border-gray-700/60">
        <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-2">
          Akce
        </div>
        <div className="flex flex-wrap gap-2">
          {(canEditLocal || canEditErp) && (
            <button
              type="button"
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-600/60 bg-gray-800/80 text-xs font-medium text-gray-200 hover:bg-gray-700/80"
            >
              Upravit (TODO)
            </button>
          )}
          {event.resource?.erpProject && (
            <a
              href={`/hwsw-config?projekt=${encodeURIComponent(event.resource.erpProject)}`}
              className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-500/35 bg-gray-800/80 shadow-sm transition-all hover:bg-gray-700/80 hover:border-blue-400/45 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <span className="text-gray-300">HW/SW konfigurace</span>
            </a>
          )}
        </div>
      </div>
    </aside>
  )
}

export default function KalenderClient({ userRole, outlookAvailable }: KalenderClientProps) {
  const { status } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [outlookEnabled, setOutlookEnabled] = useState(false)
  const autoOutlookSyncRef = useRef(false)
  const [syncingWithOutlook, setSyncingWithOutlook] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [outlookEventCount, setOutlookEventCount] = useState(0)

  const [syncingWithErp, setSyncingWithErp] = useState(false)
  const [erpSyncError, setErpSyncError] = useState<string | null>(null)
  const [erpEventCount, setErpEventCount] = useState(0)
  const [localEventCount, setLocalEventCount] = useState(0)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<string>('month')

  const [eventFilters, setEventFilters] = useState<EventFilters>({
    showLocal: true,
    showErp: true,
    showOutlook: true,
    categories: {
      MEETING: true,
      OTHER: true,
      ERP_UPGRADE: true,
      ERP_PATCH: true,
      ERP_ABSENCE: true,
    },
  })

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)
    switch (direction) {
      case 'prev':
        if (currentView === Views.MONTH) newDate.setMonth(newDate.getMonth() - 1)
        else if (currentView === Views.WEEK) newDate.setDate(newDate.getDate() - 7)
        else newDate.setDate(newDate.getDate() - 1)
        break
      case 'next':
        if (currentView === Views.MONTH) newDate.setMonth(newDate.getMonth() + 1)
        else if (currentView === Views.WEEK) newDate.setDate(newDate.getDate() + 7)
        else newDate.setDate(newDate.getDate() + 1)
        break
      case 'today':
        setCurrentDate(new Date())
        return
    }
    setCurrentDate(newDate)
  }

  const fetchEvents = async () => {
    logger.log('fetchEvents: Starting fetch')
    setLoading(true)
    try {
      const response = await fetch('/api/events')
      logger.log('fetchEvents: Response status:', response.status)

      if (response.ok) {
        const data: Event[] = await response.json()
        const calendarEvents: CalendarEvent[] = data.map((event) => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          allDay: event.allDay,
          resource: event,
        }))

        setEvents(calendarEvents)

        const erpEvents = data.filter((event) => event.isErpEvent)
        const outlookEvents = data.filter((event) => event.isOutlookEvent || event.outlookId)
        const localEvents = data.filter((event) => !event.isErpEvent && !event.isOutlookEvent && !event.outlookId)

        setErpEventCount(erpEvents.length)
        setOutlookEventCount(outlookEvents.length)
        setLocalEventCount(localEvents.length)
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

  const filterEvents = (items: CalendarEvent[]): CalendarEvent[] => {
    return items.filter((event) => {
      const isOutlookEvent = event.id.startsWith('outlook-') || event.resource?.isOutlookEvent
      const isErpEvent = event.resource?.isErpEvent

      if (!eventFilters.showLocal && !isOutlookEvent && !isErpEvent) return false
      if (!eventFilters.showErp && isErpEvent) return false
      if (!eventFilters.showOutlook && isOutlookEvent) return false

      const category = getEventCategoryForFilter(event)
      if (category !== null && !eventFilters.categories[category]) {
        return false
      }

      return true
    })
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const syncMoreOutlookEvents = async () => {
    if (!outlookEnabled || !outlookAvailable) return
    setSyncingWithOutlook(true)
    setSyncError(null)
    try {
      const result = await OutlookCalendarService.syncOutlookEvents()
      logger.log('Outlook Sync result:', result)
      if (result.errors.length > 0) {
        setSyncError(result.errors.join('; '))
      }
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
      await fetchEvents()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('syncErpEvents: Sync error:', error)
      setErpSyncError('Sync failed: ' + errorMessage)
    } finally {
      setSyncingWithErp(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents()
    }
  }, [status])

  useEffect(() => {
    if (!outlookAvailable) return
    if (status !== 'authenticated') return
    if (typeof window === 'undefined') return

    const raw = window.localStorage.getItem('outlook_integration_enabled')
    if (raw === null) {
      // Doménový login, žádná preference: výchozí zapnuto
      setOutlookEnabled(true)
      OutlookCalendarService.setOutlookIntegration(true)
      return
    }

    setOutlookEnabled(raw == 'true')
  }, [status, outlookAvailable])

  useEffect(() => {
    if (!outlookAvailable) return
    if (!outlookEnabled) return
    if (autoOutlookSyncRef.current) return
    autoOutlookSyncRef.current = true
    syncMoreOutlookEvents()
  }, [outlookAvailable, outlookEnabled])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent w-full px-6 sm:px-8 pt-6 sm:pt-8">
      <div className="space-y-6">
        <HlavickaKalendare
          localCount={localEventCount}
          erpCount={erpEventCount}
          outlookCount={outlookEventCount}
          syncingErp={syncingWithErp}
          erpError={erpSyncError}
          onSyncErp={syncErpEvents}
          outlookAvailable={outlookAvailable}
          outlookEnabled={outlookEnabled && outlookAvailable}
          syncingOutlook={syncingWithOutlook}
          outlookError={syncError}
          onToggleOutlook={() => {
            if (!outlookAvailable) return
            const next = !outlookEnabled
            setOutlookEnabled(next)
            OutlookCalendarService.setOutlookIntegration(next)
          }}
          onSyncOutlook={syncMoreOutlookEvents}
        />

        <FiltryKalendare
          filters={eventFilters}
          onFiltersChange={setEventFilters}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)] gap-4 items-start">
          <section className="card-professional rounded-lg border border-gray-700/60 p-3 md:p-4">
            <KalenderToolbar
              currentDate={currentDate}
              currentView={currentView}
              onNavigate={navigateDate}
              onViewChange={setCurrentView}
            />
            <FullCalendarView
              events={filterEvents(events)}
              currentDate={currentDate}
              currentView={currentView}
              onDateChange={setCurrentDate}
              onViewChange={setCurrentView}
              onEventClick={handleSelectEvent}
            />
          </section>
          <PanelUdalosti event={selectedEvent} />
        </div>
      </div>
    </div>
  )
}


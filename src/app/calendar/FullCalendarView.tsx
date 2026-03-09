'use client'

import { useRef, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import csLocale from '@fullcalendar/core/locales/cs'
import type { CalendarApi, EventClickArg, DatesSetArg, MoreLinkArg } from '@fullcalendar/core'
import { CalendarEvent } from '@/types/calendar'

const VIEW_MAP: Record<string, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  agenda: 'listWeek',
}

const VIEW_FROM_FC: Record<string, string> = {
  dayGridMonth: 'month',
  timeGridWeek: 'week',
  timeGridDay: 'day',
  listWeek: 'agenda',
  listMonth: 'agenda',
}

function eventColor(event: CalendarEvent): string {
  const isOutlookEvent = event.id.startsWith('outlook-')
  const baseColor: Record<string, string> = {
    PROJECT: '#3b82f6',
    MEETING: '#f97316',
    HOLIDAY: '#10b981',
    OTHER: '#6b7280',
    ERP_UPGRADE: '#8b5cf6',
    ERP_PATCH: '#a855f7',
    ERP_HOLIDAY: '#22c55e',
  }
  return isOutlookEvent ? '#0078d4' : (baseColor[event.resource?.type || 'OTHER'] ?? '#6b7280')
}

function toFullCalendarEvent(ce: CalendarEvent): {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  backgroundColor: string
  borderColor: string
  extendedProps: { resource: typeof ce.resource }
} {
  return {
    id: ce.id,
    title: ce.title,
    start: ce.start,
    end: ce.end,
    allDay: ce.allDay,
    backgroundColor: eventColor(ce),
    borderColor: eventColor(ce),
    extendedProps: { resource: ce.resource },
  }
}

function toCalendarEvent(arg: EventClickArg): CalendarEvent {
  const e = arg.event
  const resource = e.extendedProps?.resource
  return {
    id: e.id,
    title: e.title,
    start: e.start!,
    end: e.end!,
    allDay: e.allDay,
    resource: resource ?? ({} as CalendarEvent['resource']),
  }
}

export interface FullCalendarViewProps {
  events: CalendarEvent[]
  currentDate: Date
  currentView: string
  onDateChange: (date: Date) => void
  onViewChange: (view: string) => void
  onEventClick: (event: CalendarEvent) => void
}

export default function FullCalendarView({
  events,
  currentDate,
  currentView,
  onDateChange,
  onViewChange,
  onEventClick,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const fcView = VIEW_MAP[currentView] ?? 'dayGridMonth'

  const fcEvents = useMemo(() => events.map(toFullCalendarEvent), [events])

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  useEffect(() => {
    const api: CalendarApi | undefined = calendarRef.current?.getApi()
    if (!api) return

    // Měň view a datum jen když se opravdu liší, ať se to zbytečně „nepere“ s interní navigací
    if (api.view.type !== fcView) {
      api.changeView(fcView)
    }

    const apiDate = api.getDate()
    if (!isSameDay(apiDate, currentDate)) {
      api.gotoDate(currentDate)
    }
  }, [currentDate, fcView])

  const handleDatesSet = (arg: DatesSetArg) => {
    const start = arg.start
    const viewType = arg.view.type
    if (start && !isSameDay(start, currentDate)) {
      onDateChange(start)
    }
    const mapped = VIEW_FROM_FC[viewType]
    if (mapped && mapped !== currentView) {
      onViewChange(mapped)
    }
  }

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      initialDate={currentDate}
      events={fcEvents}
      locale={csLocale}
      firstDay={1}
      dayMaxEventRows={true}
      moreLinkClick={(arg: MoreLinkArg) => {
        // Přepni na denní pohled a zároveň zapiš změnu i do rodiče,
        // aby nadpis a lokální stav odpovídal.
        onDateChange(arg.date)
        onViewChange('day')
        return 'timeGridDay'
      }}
      slotLabelFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      headerToolbar={false}
      datesSet={handleDatesSet}
      eventClick={(arg: EventClickArg) => {
        arg.jsEvent.preventDefault()
        onEventClick(toCalendarEvent(arg))
      }}
      height={800}
    />
  )
}

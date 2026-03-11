'use client'

import { useRef, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import csLocale from '@fullcalendar/core/locales/cs'
import type { CalendarApi, EventClickArg, DatesSetArg } from '@fullcalendar/core'
import { CalendarEvent } from '@/types/calendar'
import { getEventColor } from '@/lib/calendar-event-tokens'

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
    backgroundColor: getEventColor(ce),
    borderColor: getEventColor(ce),
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
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
  const skipNextDatesSetRef = useRef(false)
  const syncFromMoreLinkRef = useRef(false)
  const fcView = VIEW_MAP[currentView] ?? 'dayGridMonth'

  const fcEvents = useMemo(() => events.map(toFullCalendarEvent), [events])

  useEffect(() => {
    const run = () => {
      const api: CalendarApi | undefined = calendarRef.current?.getApi()
      if (!api) return false
      if (api.view.type !== fcView) {
        api.changeView(fcView)
      }
      const apiDate = api.getDate()
      if (!isSameDay(apiDate, currentDate)) {
        skipNextDatesSetRef.current = true
        api.gotoDate(currentDate)
      }
      return true
    }
    if (!run()) {
      const t = setTimeout(run, 50)
      return () => clearTimeout(t)
    }
  }, [currentDate, fcView])

  const handleDatesSet = (arg: DatesSetArg) => {
    if (skipNextDatesSetRef.current) {
      skipNextDatesSetRef.current = false
      return
    }
    if (!syncFromMoreLinkRef.current) return
    syncFromMoreLinkRef.current = false
    const start = arg.start
    const viewType = arg.view.type
    if (start) onDateChange(start)
    const mapped = VIEW_FROM_FC[viewType]
    if (mapped) onViewChange(mapped)
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
      moreLinkClick={() => {
        syncFromMoreLinkRef.current = true
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

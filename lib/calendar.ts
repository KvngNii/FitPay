// Add-to-Calendar helpers. No OAuth — we generate a Google Calendar "template"
// link and a downloadable .ics file, which also works with Apple and Outlook.
import { SESSION_DURATION_MINS } from './slots'

type CalendarEvent = {
  title: string
  start: Date
  durationMins?: number
  details?: string
  location?: string
}

// YYYYMMDDTHHMMSSZ (UTC basic format)
function toICalUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function googleCalendarUrl({
  title,
  start,
  durationMins = SESSION_DURATION_MINS,
  details = '',
  location = '',
}: CalendarEvent): string {
  const end = new Date(start.getTime() + durationMins * 60_000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toICalUTC(start)}/${toICalUTC(end)}`,
    details,
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildIcs({
  uid,
  title,
  start,
  durationMins = SESSION_DURATION_MINS,
  details = '',
  location = '',
  stamp,
}: CalendarEvent & { uid: string; stamp: Date }): string {
  const end = new Date(start.getTime() + durationMins * 60_000)
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitPay//Sessions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICalUTC(stamp)}`,
    `DTSTART:${toICalUTC(start)}`,
    `DTEND:${toICalUTC(end)}`,
    `SUMMARY:${esc(title)}`,
    details ? `DESCRIPTION:${esc(details)}` : '',
    location ? `LOCATION:${esc(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

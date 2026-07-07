'use client'

import { useState } from 'react'
import { CalendarPlus, Check } from 'lucide-react'
import { googleCalendarUrl } from '@/lib/calendar'

// Compact "Add to calendar" control: a Google Calendar link plus an .ics
// download (Apple/Outlook). No OAuth — just a template link and a file.
export default function AddToCalendar({
  sessionId,
  scheduledAt,
  title = 'FitPay training session',
  compact = false,
}: {
  sessionId: string
  scheduledAt: string
  title?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const gcalUrl = googleCalendarUrl({ title, start: new Date(scheduledAt) })

  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <CalendarPlus size={13} />
        Add to calendar
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={gcalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 px-3 py-1.5 rounded-lg transition-colors"
      >
        <CalendarPlus size={13} />
        Google Calendar
      </a>
      <a
        href={`/api/calendar/${sessionId}`}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/70 border border-slate-700 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Check size={13} />
        Apple / Outlook (.ics)
      </a>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react'
import AddToCalendar from '@/components/AddToCalendar'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type CalSession = { id: string; scheduled_at: string; status: string; client_name: string }

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function keyOf(iso: string) {
  const d = new Date(iso)
  return ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export default function TrainerCalendar() {
  const today = new Date()
  const [viewY, setViewY] = useState(today.getUTCFullYear())
  const [viewM, setViewM] = useState(today.getUTCMonth())
  const [selected, setSelected] = useState<string | null>(ymd(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const [sessions, setSessions] = useState<CalSession[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const from = new Date(Date.UTC(viewY, viewM, 1)).toISOString()
    const to = new Date(Date.UTC(viewY, viewM + 1, 0, 23, 59, 59)).toISOString()
    try {
      const res = await fetch(`/api/sessions/availability?from=${from}&to=${to}`)
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      setSessions([])
    }
    setLoading(false)
  }, [viewY, viewM])

  useEffect(() => { load() }, [load])

  const byDay = new Map<string, CalSession[]>()
  for (const s of sessions) {
    const k = keyOf(s.scheduled_at)
    const arr = byDay.get(k) ?? []
    arr.push(s)
    byDay.set(k, arr)
  }

  function prevMonth() {
    setSelected(null)
    if (viewM === 0) { setViewY(viewY - 1); setViewM(11) } else { setViewM(viewM - 1) }
  }
  function nextMonth() {
    setSelected(null)
    if (viewM === 11) { setViewY(viewY + 1); setViewM(0) } else { setViewM(viewM + 1) }
  }

  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate()
  const startWeekday = (new Date(Date.UTC(viewY, viewM, 1)).getUTCDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const todayKey = ymd(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const selectedSessions = selected ? (byDay.get(selected) ?? []) : []
  const monthTotal = sessions.length

  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    : null

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} aria-label="Previous month" className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-100">{MONTHS[viewM]} {viewY}</p>
          <p className="text-xs text-slate-500">{monthTotal} session{monthTotal !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={nextMonth} aria-label="Next month" className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div className="card !p-3 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>
        <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />
            const key = ymd(viewY, viewM, day)
            const count = byDay.get(key)?.length ?? 0
            const isToday = key === todayKey
            const isSel = selected === key
            return (
              <button
                key={key}
                onClick={() => setSelected(isSel ? null : key)}
                className={`relative aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-colors ${
                  isSel
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 font-bold'
                    : 'text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700'
                } ${isToday && !isSel ? 'border border-emerald-500/40' : ''}`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className={`mt-0.5 text-[9px] font-bold px-1 rounded-full ${
                    isSel ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day's sessions */}
      {selected && (
        <div className="animate-fade-in-up">
          <h2 className="section-label mb-3">{selectedLabel}</h2>
          {selectedSessions.length > 0 ? (
            <div className="space-y-2">
              {selectedSessions
                .slice()
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map((s) => {
                  const time = new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })
                  return (
                    <div key={s.id} className="card">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-14 text-center">
                          <p className="text-sm font-bold text-emerald-400 tabular-nums">{time}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700/70" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-50 truncate">{s.client_name}</p>
                          <span className={`text-xs capitalize ${s.status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`}>{s.status}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <AddToCalendar sessionId={s.id} scheduledAt={s.scheduled_at} title={`FitPay session with ${s.client_name}`} compact />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="card text-center py-6">
              <CalendarX size={22} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No sessions this day.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

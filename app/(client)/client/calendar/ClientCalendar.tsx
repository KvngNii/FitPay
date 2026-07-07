'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react'
import { SLOTS, slotDateTime } from '@/lib/slots'
import AddToCalendar from '@/components/AddToCalendar'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function ClientCalendar({ sessionsLeft }: { sessionsLeft: number }) {
  const router = useRouter()
  const today = new Date()
  const todayY = today.getUTCFullYear()
  const todayM = today.getUTCMonth()
  const todayD = today.getUTCDate()

  const [viewY, setViewY] = useState(todayY)
  const [viewM, setViewM] = useState(todayM)
  const [selected, setSelected] = useState<string | null>(null)
  const [booked, setBooked] = useState<Set<number>>(new Set())
  const [mine, setMine] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [bookingHour, setBookingHour] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [justBooked, setJustBooked] = useState<{ id: string; at: string } | null>(null)
  const [remaining, setRemaining] = useState(sessionsLeft)

  const loadAvailability = useCallback(async () => {
    setLoading(true)
    const from = new Date(Date.UTC(viewY, viewM, 1)).toISOString()
    const to = new Date(Date.UTC(viewY, viewM + 1, 0, 23, 59, 59)).toISOString()
    try {
      const res = await fetch(`/api/sessions/availability?from=${from}&to=${to}`)
      const data = await res.json()
      setBooked(new Set<number>((data.booked ?? []).map((s: string) => new Date(s).getTime())))
      setMine(new Set<number>((data.mine ?? []).map((s: string) => new Date(s).getTime())))
    } catch {
      setError('Could not load availability. Try again.')
    }
    setLoading(false)
  }, [viewY, viewM])

  useEffect(() => { loadAvailability() }, [loadAvailability])

  const isCurrentMonth = viewY === todayY && viewM === todayM
  const canGoPrev = !isCurrentMonth

  function prevMonth() {
    if (!canGoPrev) return
    setSelected(null)
    if (viewM === 0) { setViewY(viewY - 1); setViewM(11) } else { setViewM(viewM - 1) }
  }
  function nextMonth() {
    setSelected(null)
    if (viewM === 11) { setViewY(viewY + 1); setViewM(0) } else { setViewM(viewM + 1) }
  }

  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate()
  const startWeekday = (new Date(Date.UTC(viewY, viewM, 1)).getUTCDay() + 6) % 7 // Mon=0
  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function dayHasMine(day: number) {
    return SLOTS.some((s) => mine.has(slotDateTime(ymd(viewY, viewM, day), s.hour).getTime()))
  }
  function isPastDay(day: number) {
    if (viewY < todayY) return true
    if (viewY === todayY && viewM < todayM) return true
    if (viewY === todayY && viewM === todayM && day < todayD) return true
    return false
  }

  async function book(hour: number) {
    if (!selected || remaining <= 0) return
    const dt = slotDateTime(selected, hour)
    const label = dt.toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra',
    })
    if (!confirm(`Book a session for ${label}?`)) return

    setBookingHour(hour)
    setError(null)
    const res = await fetch('/api/sessions/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_at: dt.toISOString() }),
    })
    const data = await res.json()
    setBookingHour(null)

    if (!res.ok) {
      setError(data.error ?? 'Could not book that slot. Try again.')
      return
    }
    setJustBooked({ id: data.session_id, at: dt.toISOString() })
    setRemaining((r) => r - 1)
    await loadAvailability()
    router.refresh()
  }

  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    : null

  return (
    <div>
      {remaining <= 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4 mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-300">You have no sessions left to book.</p>
          <Link href="/client/packages" className="text-xs font-semibold text-amber-300 underline shrink-0">Buy sessions</Link>
        </div>
      )}

      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-slate-100">{MONTHS[viewM]} {viewY}</p>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
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
            const past = isPastDay(day)
            const isToday = viewY === todayY && viewM === todayM && day === todayD
            const isSel = selected === key
            const hasMine = dayHasMine(day)
            return (
              <button
                key={key}
                onClick={() => !past && setSelected(isSel ? null : key)}
                disabled={past}
                className={`relative aspect-square rounded-lg text-sm flex items-center justify-center transition-colors ${
                  past
                    ? 'text-slate-700 cursor-not-allowed'
                    : isSel
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 font-bold'
                      : 'text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700'
                } ${isToday && !isSel ? 'border border-emerald-500/40' : ''}`}
              >
                {day}
                {hasMine && !isSel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot picker */}
      {selected && (
        <div className="animate-fade-in-up">
          <h2 className="section-label mb-3">{selectedLabel}</h2>
          <div className="space-y-2">
            {SLOTS.map((slot) => {
              const dt = slotDateTime(selected, slot.hour)
              const t = dt.getTime()
              const isMine = mine.has(t)
              const isTaken = booked.has(t) && !isMine
              const isPast = t <= Date.now()
              const disabled = isMine || isTaken || isPast || remaining <= 0 || bookingHour !== null

              return (
                <div
                  key={slot.hour}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isMine
                      ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
                      : isTaken || isPast
                        ? 'border-slate-800 bg-slate-900/40'
                        : 'border-slate-700 bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isTaken || isPast ? 'text-slate-500' : 'text-slate-100'}`}>{slot.label}</span>
                    {isMine && <span className="text-xs text-emerald-400">Your session</span>}
                  </div>
                  {isMine ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><Check size={13} /> Booked</span>
                  ) : isTaken ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Lock size={12} /> Unavailable</span>
                  ) : isPast ? (
                    <span className="text-xs text-slate-600">Passed</span>
                  ) : (
                    <button
                      onClick={() => book(slot.hour)}
                      disabled={disabled}
                      className="text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {bookingHour === slot.hour ? 'Booking…' : 'Book'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </div>
      )}

      {/* Just-booked confirmation with add-to-calendar */}
      {justBooked && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 animate-fade-in-up">
          <p className="text-sm font-semibold text-emerald-400 mb-1">Session booked!</p>
          <p className="text-xs text-slate-400 mb-3">
            {new Date(justBooked.at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })}
            {' · '}an SMS confirmation is on its way.
          </p>
          <AddToCalendar sessionId={justBooked.id} scheduledAt={justBooked.at} />
        </div>
      )}
    </div>
  )
}

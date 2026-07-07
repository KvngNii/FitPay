'use client'

import { useState, useEffect } from 'react'
import { Dumbbell, ChevronDown, ChevronUp, Zap, FlameKindling } from 'lucide-react'
import AddToCalendar from '@/components/AddToCalendar'
import type { ExerciseEntry } from '@/types'

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, target.getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    isPast: diff === 0,
  }
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner shadow-black/30">
        <span className="text-2xl font-bold tabular-nums glow-text leading-none">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function DifficultyBadge({ d }: { d: string }) {
  const map: Record<string, string> = {
    easy: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/20',
    moderate: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/20',
    hard: 'bg-red-900/40 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${map[d] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {d}
    </span>
  )
}

type Props = {
  session: { id: string; scheduled_at: string; notes?: string | null }
  nextPlan: ExerciseEntry[] | null
  isNext: boolean
}

export default function UpcomingSessionCard({ session, nextPlan, isNext }: Props) {
  const target = new Date(session.scheduled_at)
  const { days, hours, minutes, seconds, isPast } = useCountdown(target)
  const [open, setOpen] = useState(false)

  const dateStr = target.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = target.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (!isNext) {
    return (
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-50">{dateStr}</p>
          <p className="text-sm text-slate-400">{timeStr}</p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
          {days}d away
        </span>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-slate-900/80 overflow-hidden shadow-xl shadow-emerald-500/5">
      {/* Top glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(224, 123, 31,0.1), transparent)',
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Next session
              </span>
            </div>
            <p className="font-semibold text-slate-50">{dateStr}</p>
            <p className="text-sm text-slate-400">{timeStr}</p>
          </div>
          <Zap size={22} className="text-emerald-400 animate-pulse-glow" />
        </div>

        {/* Countdown */}
        {isPast ? (
          <div className="flex items-center gap-2 py-3">
            <FlameKindling size={18} className="text-emerald-400" />
            <p className="font-semibold text-emerald-400">Session in progress — get to it!</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-2">
            {days > 0 && <Tile value={days} label="days" />}
            <Tile value={hours} label="hrs" />
            <Tile value={minutes} label="min" />
            <Tile value={seconds} label="sec" />
          </div>
        )}

        {/* Expandable workout */}
        {nextPlan && nextPlan.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Dumbbell size={15} className="text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  {open ? "Hide workout" : "See your workout"}
                </span>
              </div>
              {open
                ? <ChevronUp size={16} className="text-emerald-400" />
                : <ChevronDown size={16} className="text-emerald-400" />
              }
            </button>

            {open && (
              <div className="mt-3 space-y-2 animate-fade-in-up">
                {nextPlan.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/80"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-50 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ex.sets} sets × {ex.reps} reps
                        {ex.weight_kg > 0 ? ` · ${ex.weight_kg} kg` : ' · bodyweight'}
                      </p>
                      {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
                    </div>
                    <DifficultyBadge d={ex.difficulty} />
                  </div>
                ))}
                <p className="text-center text-xs text-slate-500 pt-1">
                  {nextPlan.length} exercise{nextPlan.length !== 1 ? 's' : ''} planned
                </p>
              </div>
            )}
          </div>
        )}

        {nextPlan === null && (
          <p className="text-center text-xs text-slate-500 mt-4">
            Workout plan will appear after your first session.
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <AddToCalendar sessionId={session.id} scheduledAt={session.scheduled_at} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '@/types'

type Props = {
  value: string
  onChange: (name: string) => void
  onSelect: (exercise: Exercise) => void
  placeholder?: string
}

// Free-text exercise name input backed by a search against the exercise
// library. Typing keeps working as before (name only, no exercise_id/gif_url)
// - picking a result from the dropdown attaches the technique GIF.
export function ExercisePicker({ value, onChange, onSelect, placeholder }: Props) {
  const [results, setResults] = useState<Exercise[]>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(value.trim())}`)
      if (!res.ok) return
      const data = await res.json()
      setResults(data.exercises ?? [])
    }, 250)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        placeholder={placeholder ?? 'Exercise name'}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => { onSelect(ex); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left hover:bg-slate-800 transition-colors"
            >
              {ex.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ex.image_url} alt="" width={32} height={32} className="rounded-md shrink-0 bg-slate-800" />
              ) : (
                <div className="w-8 h-8 rounded-md bg-slate-800 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-slate-100 truncate capitalize">{ex.name}</p>
                <p className="text-[11px] text-slate-500 truncate capitalize">{ex.body_part} · {ex.equipment}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

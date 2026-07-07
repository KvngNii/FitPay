// Reusable loading skeletons composed by route-level loading.tsx files.
// Server components — they render instantly while the real page streams in.

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />
}

export function SkeletonHeader({ wide = false }: { wide?: boolean }) {
  return (
    <div className="mb-6">
      <div className={`skeleton h-7 ${wide ? 'w-40' : 'w-32'} mb-2`} />
      <div className="skeleton h-4 w-24" />
    </div>
  )
}

export function SkeletonHero() {
  return <div className="skeleton h-28 w-full rounded-2xl mb-4" />
}

export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="skeleton h-4 w-1/3 mb-2.5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3.5 ${i === 0 ? 'w-2/3' : 'w-1/2'} mb-2`} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 3, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  )
}

export function SkeletonSectionLabel() {
  return <div className="skeleton h-3.5 w-28 mb-3" />
}

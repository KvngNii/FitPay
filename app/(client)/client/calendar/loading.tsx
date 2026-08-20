import { SkeletonSectionLabel } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-36 mb-1.5" />
      <div className="skeleton h-4 w-64 mb-6" />
      <div className="skeleton h-40 w-full rounded-xl mb-6" />
      <SkeletonSectionLabel />
      <div className="skeleton h-72 w-full rounded-xl" />
    </main>
  )
}

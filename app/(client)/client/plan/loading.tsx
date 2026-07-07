import { SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-32 mb-1.5" />
      <div className="skeleton h-4 w-28 mb-5" />
      <SkeletonSectionLabel />
      <SkeletonList count={4} lines={1} />
    </main>
  )
}

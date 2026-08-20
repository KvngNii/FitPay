import { SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="skeleton h-7 w-36 mb-5" />
      <div className="skeleton h-16 w-full rounded-xl mb-8" />
      <SkeletonSectionLabel />
      <div className="mb-8">
        <SkeletonList count={3} lines={1} />
      </div>
      <SkeletonSectionLabel />
      <SkeletonList count={3} lines={1} />
    </main>
  )
}

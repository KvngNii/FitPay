import { SkeletonStatRow, SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-40 mb-5" />
      <SkeletonStatRow />
      <div className="skeleton h-28 w-full rounded-xl mb-6" />
      <SkeletonSectionLabel />
      <SkeletonList count={4} lines={1} />
    </main>
  )
}

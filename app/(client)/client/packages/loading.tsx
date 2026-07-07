import { SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-36 mb-1.5" />
      <div className="skeleton h-4 w-52 mb-5" />
      <SkeletonSectionLabel />
      <div className="mb-8">
        <SkeletonList count={2} />
      </div>
      <SkeletonSectionLabel />
      <SkeletonList count={3} />
    </main>
  )
}

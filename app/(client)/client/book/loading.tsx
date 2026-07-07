import { SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-44 mb-1.5" />
      <div className="skeleton h-4 w-56 mb-5" />
      <div className="skeleton h-52 w-full rounded-xl mb-8" />
      <SkeletonSectionLabel />
      <SkeletonList count={2} />
    </main>
  )
}

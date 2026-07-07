import { SkeletonHeader, SkeletonHero, SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-lg mx-auto">
      <SkeletonHeader />
      <SkeletonHero />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-24 rounded-xl" />
      </div>
      <SkeletonSectionLabel />
      <SkeletonList count={4} />
    </main>
  )
}

import { SkeletonHeader, SkeletonHero, SkeletonStatRow, SkeletonSectionLabel, SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <SkeletonHeader wide />
      <SkeletonHero />
      <SkeletonStatRow />
      <SkeletonSectionLabel />
      <div className="mb-6">
        <SkeletonList count={2} lines={1} />
      </div>
      <SkeletonSectionLabel />
      <SkeletonList count={4} />
    </main>
  )
}

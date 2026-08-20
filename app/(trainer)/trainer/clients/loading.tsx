import { SkeletonList } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="skeleton h-7 w-32 mb-5" />
      <SkeletonList count={5} lines={3} />
    </main>
  )
}

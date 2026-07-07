import TrainerCalendar from './TrainerCalendar'

export const dynamic = 'force-dynamic'

export default function TrainerCalendarPage() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="page-title mb-1 animate-fade-in-up">Calendar</h1>
      <p className="text-slate-400 text-sm mb-5">An overview of your booked sessions. Tap a day to see who&apos;s in.</p>
      <TrainerCalendar />
    </main>
  )
}

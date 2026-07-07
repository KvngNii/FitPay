import { redirect } from 'next/navigation'

// Booking now lives on the calendar. Keep this route working for old links.
export default function BookRedirect() {
  redirect('/client/calendar')
}

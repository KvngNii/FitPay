// Standard daily training slots. A slot is "free" unless a session is already
// booked at that exact datetime (single-trainer model). Shared by the client
// calendar, the trainer calendar, and the availability API.
export const SLOT_HOURS = [6, 8, 12, 16, 18] as const

export const SLOTS = SLOT_HOURS.map((hour) => ({
  hour,
  label: new Date(Date.UTC(2000, 0, 1, hour)).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }),
}))

export const SESSION_DURATION_MINS = 60

// Ghana is UTC+0 (no DST) - build slot datetimes in UTC so they are stable
// regardless of server timezone.
export function slotDateTime(dateYMD: string, hour: number): Date {
  const [y, m, d] = dateYMD.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0))
}

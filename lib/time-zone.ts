// Conversioni di orario tra Europe/Rome e UTC senza dipendenze native.
// Tutti gli orari in database sono UTC; l'utente vede sempre l'ora di Roma.

export const TIME_ZONE = 'Europe/Rome'

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  timeZoneName: 'longOffset',
})

/** Offset di Roma rispetto a UTC in millisecondi (positivo d'estate). */
export function zoneOffsetMs(instant: number): number {
  const name = offsetFormatter
    .formatToParts(new Date(instant))
    .find((part) => part.type === 'timeZoneName')?.value

  if (!name || name === 'GMT') return 0
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2])
  const minutes = Number(match[3] ?? 0)
  return sign * (hours * 60 + minutes) * MINUTE_MS
}

/** Interpreta data (YYYY-MM-DD) e minuti dalla mezzanotte come ora di Roma. */
export function zonedTimeToUtc(dateKey: string, minutes: number): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const naive = Date.UTC(year, month - 1, day, 0, minutes, 0)
  let guess = naive - zoneOffsetMs(naive)
  guess = naive - zoneOffsetMs(guess)
  return new Date(guess)
}

export function utcToZonedParts(value: Date | string) {
  const date = new Date(value)
  const shifted = new Date(date.getTime() + zoneOffsetMs(date.getTime()))
  const hour = shifted.getUTCHours()
  const minute = shifted.getUTCMinutes()

  return {
    dateKey: shifted.toISOString().slice(0, 10),
    hour,
    minute,
    minutes: hour * 60 + minute,
    weekday: shifted.getUTCDay(),
  }
}

export function todayKey(now: Date = new Date()): string {
  return utcToZonedParts(now).dateKey
}

export function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS)
  return next.toISOString().slice(0, 10)
}

export function formatDateKey(dateKey: string): { weekday: string; day: string; month: string } {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  const weekday = new Intl.DateTimeFormat('it-IT', { weekday: 'long', timeZone: 'UTC' }).format(date)
  const dayLabel = new Intl.DateTimeFormat('it-IT', { day: 'numeric', timeZone: 'UTC' }).format(date)
  const monthLabel = new Intl.DateTimeFormat('it-IT', { month: 'long', timeZone: 'UTC' }).format(date)
  const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
  return { weekday: cap(weekday), day: dayLabel, month: cap(monthLabel) }
}
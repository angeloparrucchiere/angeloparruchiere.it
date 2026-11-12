import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSlots, windowsForWeekday, type AvailabilityWindow, type Interval } from '@/lib/slots'
import { addDaysToKey, parseTimeToMinutes, todayKey, utcToZonedParts, zonedTimeToUtc } from '@/lib/time-zone'
import type { Availability, DaySlots, Service, Staff } from '@/lib/db/types'

export const BOOKING_RULES = {
  stepMinutes: 15,
  minLeadMinutes: 60,
  maxDaysAhead: 60,
} as const

type Booking = { staff_id: string; starts_at: string; ends_at: string }

function toMinutes(instant: string, dateKey: string): number {
  const parts = utcToZonedParts(instant)
  return parts.dateKey < dateKey ? 0 : Math.min(24 * 60, parts.minutes)
}

function toWindows(availability: Availability[]): AvailabilityWindow[] {
  return availability.map((a) => ({
    weekday: a.weekday,
    startMinutes: parseTimeToMinutes(a.start_time.slice(0, 5)),
    endMinutes: parseTimeToMinutes(a.end_time.slice(0, 5)),
  }))
}

type DayData = {
  byStaff: Map<string, Availability[]>
  busyByStaff: Map<string, Interval[]>
}

/** Carica in due query sola la disponibilita settimanale e gli impegni del giorno. */
async function loadDayData(staffIds: string[], dateKey: string): Promise<DayData> {
  const admin = createAdminClient()
  const dayStart = zonedTimeToUtc(dateKey, 0)
  const dayEnd = zonedTimeToUtc(addDaysToKey(dateKey, 1), 0)

  const [{ data: availability, error: availError }, { data: booked, error: bookedError }] =
    await Promise.all([
      admin
        .from('availability')
        .select('id, staff_id, weekday, start_time, end_time')
        .in('staff_id', staffIds),
      admin
        .from('appointments')
        .select('staff_id, starts_at, ends_at')
        .in('staff_id', staffIds)
        .in('status', ['richiesto', 'confermato'])
        .lt('starts_at', dayEnd.toISOString())
        .gt('ends_at', dayStart.toISOString()),
    ])

  if (availError) throw availError
  if (bookedError) throw bookedError

  const byStaff = new Map<string, Availability[]>()
  for (const row of (availability ?? []) as Availability[]) {
    byStaff.set(row.staff_id, [...(byStaff.get(row.staff_id) ?? []), row])
  }

  const busyByStaff = new Map<string, Interval[]>()
  for (const row of (booked ?? []) as Booking[]) {
    const interval = { start: toMinutes(row.starts_at, dateKey), end: toMinutes(row.ends_at, dateKey) }
    if (interval.end <= 0) continue
    busyByStaff.set(row.staff_id, [...(busyByStaff.get(row.staff_id) ?? []), interval])
  }

  return { byStaff, busyByStaff }
}

/**
 * Slot liberi di un giorno per un servizio, uniti tra i parrucchieri abilitati.
 * Ogni orario compare una sola volta, con l'elenco dei parrucchieri disponibili.
 */
export async function getDaySlots(
  service: Service,
  staffList: Staff[],
  dateKey: string,
  now: Date = new Date(),
): Promise<DaySlots> {
  if (!staffList.length) return { date: dateKey, staffIds: [], slots: [] }

  const weekday = utcToZonedParts(zonedTimeToUtc(dateKey, 12)).weekday
  const { byStaff, busyByStaff } = await loadDayData(staffList.map((s) => s.id), dateKey)
  const availableStaff = new Set<string>()
  const allSlots = new Map<number, { startsAt: string; endsAt: string }>()

  for (const staff of staffList) {
    const windows = windowsForWeekday(toWindows(byStaff.get(staff.id) ?? []), weekday)
    const slots = generateSlots(windows, busyByStaff.get(staff.id) ?? [], {
      durationMinutes: service.duration_minutes,
      stepMinutes: BOOKING_RULES.stepMinutes,
      minLeadMinutes: BOOKING_RULES.minLeadMinutes,
      now,
      toInstant: (minutes) => zonedTimeToUtc(dateKey, minutes),
    })

    for (const slot of slots) {
      availableStaff.add(staff.id)
      if (!allSlots.has(slot.startMinutes)) {
        allSlots.set(slot.startMinutes, { startsAt: slot.startsAt, endsAt: slot.endsAt })
      }
    }
  }

  return {
    date: dateKey,
    staffIds: [...availableStaff],
    slots: [...allSlots.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([startMinutes, times]) => ({ startMinutes, ...times })),
  }
}

/** Tutti i giorni prenotabili (oggi incluso) per il selettore data. */
export function dateRangeKeys(fromKey: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDaysToKey(fromKey, index))
}

export function firstBookableKey(now: Date = new Date()): string {
  return todayKey(now)
}
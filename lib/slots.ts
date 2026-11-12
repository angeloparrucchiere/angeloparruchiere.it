export type Interval = { start: number; end: number }

export type AvailabilityWindow = {
  weekday: number
  startMinutes: number
  endMinutes: number
}

export type SlotOptions = {
  durationMinutes: number
  stepMinutes: number
  minLeadMinutes: number
  now: Date
  toInstant: (minutes: number) => Date
}

export type Slot = {
  startMinutes: number
  endMinutes: number
  startsAt: string
  endsAt: string
}

export function windowsForWeekday(windows: AvailabilityWindow[], weekday: number): Interval[] {
  return windows
    .filter((w) => w.weekday === weekday)
    .map((w) => ({ start: w.startMinutes, end: w.endMinutes }))
    .sort((a, b) => a.start - b.start)
}

/** Il servizio non deve toccare nessun appuntamento gia preso. */
export function isRangeFree(start: number, end: number, busy: Interval[]): boolean {
  return busy.every((b) => end <= b.start || start >= b.end)
}

/**
 * Concatena gli appuntamenti in blocchi: se due si toccano o si sovrappongono
 * diventano un unico blocco, cosi la durata del nuovo servizio entra comunque.
 */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .map((i) => ({ ...i }))
    .sort((a, b) => a.start - b.start)

  const merged: Interval[] = []
  for (const next of sorted) {
    const last = merged.at(-1)
    if (last && next.start <= last.end) {
      last.end = Math.max(last.end, next.end)
    } else {
      merged.push(next)
    }
  }
  return merged
}

export function generateSlots(
  windows: Interval[],
  busy: Interval[],
  options: SlotOptions,
): Slot[] {
  const { durationMinutes, stepMinutes, minLeadMinutes, now, toInstant } = options
  if (durationMinutes <= 0 || stepMinutes <= 0) return []

  const blocked = mergeIntervals(busy)
  const leadMs = now.getTime() + minLeadMinutes * 60 * 1000
  const slots: Slot[] = []
  const seen = new Set<number>()

  for (const window of windows) {
    for (let start = window.start; start + durationMinutes <= window.end; start += stepMinutes) {
      if (seen.has(start)) continue
      const end = start + durationMinutes
      if (!isRangeFree(start, end, blocked)) continue

      const startsAt = toInstant(start)
      const endsAt = toInstant(end)
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) continue
      if (startsAt.getTime() < leadMs) continue

      seen.add(start)
      slots.push({
        startMinutes: start,
        endMinutes: end,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      })
    }
  }

  return slots.sort((a, b) => a.startMinutes - b.startMinutes)
}
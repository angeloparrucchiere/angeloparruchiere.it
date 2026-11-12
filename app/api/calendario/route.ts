import { ok, fail } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { authErrorResponse } from '@/lib/server-errors'
import { getActiveServices, getStaffForService } from '@/lib/db/catalog'
import { getDaySlots } from '@/lib/db/availability'
import { addDaysToKey, todayKey } from '@/lib/time-zone'

/** Slot liberi per i clienti loggati: usato per spostare un appuntamento. */
export async function GET(request: Request) {
  try {
    await requireUser()
    const date = new URL(request.url).searchParams.get('date') ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Data non valida', 400)
    if (date < todayKey() || date > addDaysToKey(todayKey(), 60)) return fail('Data fuori dal calendario', 400)

    const services = await getActiveServices()
    const merged = new Map<number, string>()
    for (const service of services) {
      const staffList = await getStaffForService(service.id)
      if (!staffList.length) continue
      const day = await getDaySlots(service, staffList, date)
      for (const slot of day.slots) {
        if (!merged.has(slot.startMinutes)) merged.set(slot.startMinutes, slot.startsAt)
      }
    }

    return ok({
      date,
      slots: [...merged.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([startMinutes, startsAt]) => ({ startMinutes, startsAt })),
    })
  } catch (error) {
    return authErrorResponse(error) ?? fail('Calendario non disponibile.', 500)
  }
}
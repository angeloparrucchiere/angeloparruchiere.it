import { getDaySlots, BOOKING_RULES } from '@/lib/db/availability'
import { getActiveServices, getStaffForService } from '@/lib/db/catalog'
import { ok, fail } from '@/lib/api'
import { addDaysToKey, todayKey } from '@/lib/time-zone'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const serviceId = url.searchParams.get('service') ?? ''
  const date = url.searchParams.get('date') ?? ''

  if (!/^[0-9a-f-]{36}$/i.test(serviceId)) return fail('Servizio non valido', 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Data non valida', 400)

  const today = todayKey()
  const lastDay = addDaysToKey(today, BOOKING_RULES.maxDaysAhead)
  if (date < today || date > lastDay) {
    return fail('Puoi prenotare solo nei prossimi 60 giorni', 400)
  }

  try {
    const services = await getActiveServices()
    const service = services.find((item) => item.id === serviceId)
    if (!service) return fail('Servizio non disponibile', 404)

    const staffList = await getStaffForService(service.id)
    if (!staffList.length) return ok({ date, slots: [], durationMinutes: service.duration_minutes })

    const result = await getDaySlots(service, staffList, date)
    return ok({
      date: result.date,
      durationMinutes: service.duration_minutes,
      slots: result.slots.map((slot) => ({ startMinutes: slot.startMinutes, startsAt: slot.startsAt })),
    })
  } catch {
    return fail('Non riesco a calcolare gli orari. Riprova.', 500)
  }
}
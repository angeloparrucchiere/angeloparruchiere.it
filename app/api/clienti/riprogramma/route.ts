import { ok, fail, parseBody, readJson } from '@/lib/api'
import { rescheduleSchema } from '@/lib/validation/schemas'
import { requireUser } from '@/lib/auth'
import { authErrorResponse } from '@/lib/server-errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveServices, getStaffForService } from '@/lib/db/catalog'
import { getDaySlots } from '@/lib/db/availability'
import { getMyAppointment } from '@/lib/db/my-appointments'
import { appointmentRescheduledEmail } from '@/lib/email/templates'
import { sendOrQueueUnique } from '@/lib/email/send'
import type { AppointmentWithStaff } from '@/lib/db/types'

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    const parsed = parseBody(rescheduleSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    const appointment = await getMyAppointment(parsed.data.appointmentId, session.id)
    if (!appointment) return fail('Appuntamento non trovato.', 404)
    if (appointment.status !== 'richiesto' && appointment.status !== 'confermato') {
      return fail('Questo appuntamento non puo essere spostato.', 409)
    }

    const services = await getActiveServices()
    const service = services.find((item) => item.id === appointment.service_id)
    if (!service) return fail('Il servizio non e piu disponibile: scrivici.', 409)

    const staffList = await getStaffForService(service.id)
    const slots = await getDaySlots(service, staffList, parsed.data.date)
    const slot = slots.slots.find((item) => item.startMinutes === parsed.data.startMinutes)
    if (!slot) return fail('Questo orario non e piu libero. Scegline un altro.', 409)

    const admin = createAdminClient()
    const sameStaff = staffList.find((staff) => staff.id === appointment.staff_id)
    const candidates = sameStaff ? [sameStaff, ...staffList.filter((s) => s.id !== sameStaff.id)] : staffList

    for (const staff of candidates) {
      const staffSlots = await getDaySlots(service, [staff], parsed.data.date)
      if (!staffSlots.slots.some((item) => item.startMinutes === parsed.data.startMinutes)) continue

      const { data, error } = await admin
        .from('appointments')
        .update({
          starts_at: slot.startsAt,
          ends_at: slot.endsAt,
          staff_id: staff.id,
          status: 'richiesto',
        })
        .eq('id', appointment.id)
        .eq('customer_id', session.id)
        .select('*, staff:staff(id, display_name)')
        .single()

      if (error || !data) continue

      const updated = data as AppointmentWithStaff
      if (session.email) {
        await sendOrQueueUnique(updated.id, {
          to: session.email,
          kind: `spostato_cliente:${updated.starts_at}`,
          content: appointmentRescheduledEmail(
            {
              firstName: session.profile.first_name,
              serviceName: updated.service_name,
              priceCents: updated.service_price_cents,
              staffName: updated.staff?.display_name ?? 'Salone',
              startsAt: updated.starts_at,
            },
            false,
          ),
        })
      }

      return ok({ id: updated.id, startsAt: updated.starts_at })
    }

    return fail('Qualcuno ha appena preso questo orario. Scegline un altro.', 409)
  } catch (error) {
    return authErrorResponse(error) ?? fail('Non riesco a spostare. Riprova.', 500)
  }
}
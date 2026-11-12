import { ok, fail, parseBody, readJson } from '@/lib/api'
import { requireStaffSession, staffAuthError } from '@/lib/staff-session'
import { staffAppointmentActionSchema } from '@/lib/validation/schemas'
import { appointmentCancelledEmail, appointmentConfirmedEmail } from '@/lib/email/templates'
import { sendOrQueueUnique } from '@/lib/email/send'
import { getAppointmentById, updateAppointmentStatus } from '@/lib/db/staff'
import type { AppointmentStatus, AppointmentWithStaff } from '@/lib/db/types'
import { revalidatePath } from 'next/cache'

const NEXT_STATUS: Record<string, AppointmentStatus> = {
  conferma: 'confermato',
  completa: 'completato',
  annulla: 'annullato',
  rifiuta: 'rifiutato',
}

export async function POST(request: Request) {
  try {
    await requireStaffSession(request)
    const parsed = parseBody(staffAppointmentActionSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    const before = await getAppointmentById(parsed.data.appointmentId)
    if (!before) return fail('Appuntamento non trovato.', 404)

    const status = NEXT_STATUS[parsed.data.action]
    if (!status) return fail('Azione non valida.', 400)

    const updated = await updateAppointmentStatus({
      id: parsed.data.appointmentId,
      status,
      staffNote: parsed.data.staffNote || undefined,
    })

    if (before.customer_email && (status === 'confermato' || status === 'annullato')) {
      const appointment: AppointmentWithStaff = {
        ...(updated as AppointmentWithStaff),
        staff: (updated as { staff?: AppointmentWithStaff['staff'] }).staff ?? null,
      }
      const data = {
        firstName: before.customer_name.split(' ')[0] ?? '',
        serviceName: appointment.service_name,
        priceCents: appointment.service_price_cents,
        staffName: appointment.staff?.display_name ?? 'Salone',
        startsAt: appointment.starts_at,
      }

      if (status === 'confermato') {
        await sendOrQueueUnique(appointment.id, {
          to: before.customer_email,
          kind: 'confermato',
          content: appointmentConfirmedEmail(data),
        })
      } else {
        await sendOrQueueUnique(appointment.id, {
          to: before.customer_email,
          kind: 'annullato_staff',
          content: appointmentCancelledEmail(data, true),
        })
      }
    }

    revalidatePath('/staff/prenotazioni')
    return ok({ status })
  } catch (error) {
    return staffAuthError(error) ?? fail('Operazione non riuscita.', 500)
  }
}
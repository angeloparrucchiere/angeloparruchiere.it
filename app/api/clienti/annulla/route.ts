import { z } from 'zod'
import { ok, fail, parseBody, readJson } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { authErrorResponse } from '@/lib/server-errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMyAppointment } from '@/lib/db/my-appointments'
import { appointmentCancelledEmail } from '@/lib/email/templates'
import { sendOrQueueUnique } from '@/lib/email/send'

const schema = z.object({ appointmentId: z.uuid() })

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    const parsed = parseBody(schema, await readJson(request))
    if (!parsed.success) return parsed.response

    const appointment = await getMyAppointment(parsed.data.appointmentId, session.id)
    if (!appointment) return fail('Appuntamento non trovato.', 404)
    if (appointment.status !== 'richiesto' && appointment.status !== 'confermato') {
      return fail('Questo appuntamento non puo essere annullato.', 409)
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('appointments')
      .update({ status: 'annullato' })
      .eq('id', appointment.id)
      .eq('customer_id', session.id)
    if (error) throw error

    if (session.email) {
      await sendOrQueueUnique(appointment.id, {
        to: session.email,
        kind: 'annullato_cliente',
        content: appointmentCancelledEmail(
          {
            firstName: session.profile.first_name,
            serviceName: appointment.service_name,
            priceCents: appointment.service_price_cents,
            staffName: appointment.staff?.display_name ?? 'Salone',
            startsAt: appointment.starts_at,
          },
          false,
        ),
      })
    }

    return ok({ status: 'annullato' })
  } catch (error) {
    return authErrorResponse(error) ?? fail('Non riesco ad annullare. Riprova.', 500)
  }
}
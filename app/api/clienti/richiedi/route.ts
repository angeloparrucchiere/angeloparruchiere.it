import { ok, fail, parseBody, readJson } from '@/lib/api'
import { bookRequestSchema } from '@/lib/validation/schemas'
import { requireUser } from '@/lib/auth'
import { authErrorResponse } from '@/lib/server-errors'
import { bookAppointment } from '@/lib/db/appointments'

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    const parsed = parseBody(bookRequestSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    const result = await bookAppointment({
      customerId: session.id,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      startMinutes: parsed.data.startMinutes,
      notes: parsed.data.notes ?? '',
    })

    if (!result.ok) return fail(result.error, result.status)
    return ok({ id: result.appointment.id, status: result.appointment.status })
  } catch (error) {
    return authErrorResponse(error) ?? fail('Richiesta non riuscita. Riprova.', 500)
  }
}
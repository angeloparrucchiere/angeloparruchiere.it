import { ok, fail, parseBody, readJson } from '@/lib/api'
import { requireStaffSession, staffAuthError } from '@/lib/staff-session'
import { availabilitySetSchema } from '@/lib/validation/schemas'
import { updateAvailability } from '@/lib/db/staff'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    await requireStaffSession(request)
    const parsed = parseBody(availabilitySetSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    for (const window of parsed.data.windows) {
      if (window.endTime <= window.startTime) {
        return fail('La fine di ogni fascia deve essere dopo l inizio.', 422)
      }
    }

    await updateAvailability(parsed.data.staffId, parsed.data.weekday, parsed.data.windows)
    revalidatePath('/staff/disponibilita')
    return ok({ saved: true })
  } catch (error) {
    return staffAuthError(error) ?? fail('Salvataggio non riuscito.', 500)
  }
}
import { ok, fail, parseBody, readJson } from '@/lib/api'
import { profileSchema } from '@/lib/validation/schemas'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { authErrorResponse } from '@/lib/server-errors'

export async function POST(request: Request) {
  try {
    const session = await requireUser()
    const parsed = parseBody(profileSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    const admin = createAdminClient()
    const patch: Record<string, unknown> = {
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone || null,
      marketing_consent: parsed.data.marketingConsent,
    }

    if (parsed.data.marketingConsent && !session.profile.marketing_consent) {
      patch.marketing_consent_at = new Date().toISOString()
    }

    const { error } = await admin.from('profiles').update(patch).eq('id', session.id)
    if (error) throw error
    return ok({ updated: true })
  } catch (error) {
    return authErrorResponse(error) ?? fail('Non riesco a salvare il profilo.', 500)
  }
}
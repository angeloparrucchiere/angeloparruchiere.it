import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrQueue } from '@/lib/email/send'
import { launchThanksEmail } from '@/lib/email/templates'
import { ok, fail, parseBody, readJson } from '@/lib/api'
import { launchSignupSchema } from '@/lib/validation/schemas'
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimit(`apertura:${clientIp(request)}`, 5, 60 * 60 * 1000)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  const parsed = parseBody(launchSignupSchema, await readJson(request))
  if (!parsed.success) return parsed.response
  if (parsed.data.website) return ok({ received: true })

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('launch_signups').insert({ email: parsed.data.email })
    if (error && error.code !== '23505') throw error

    if (!error) {
      await sendOrQueue({
        to: parsed.data.email,
        kind: 'apertura_ringraziamento',
        content: launchThanksEmail(),
      })
    }
    return ok({ received: true })
  } catch {
    return fail('Non riesco a registrare la tua email. Riprova.', 500)
  }
}
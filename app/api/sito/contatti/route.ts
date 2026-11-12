import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrQueue } from '@/lib/email/send'
import { contactReplyEmail } from '@/lib/email/templates'
import { ok, fail, parseBody, readJson } from '@/lib/api'
import { contactSchema } from '@/lib/validation/schemas'
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimit(`contatti:${clientIp(request)}`, 3, 60 * 60 * 1000)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  const parsed = parseBody(contactSchema, await readJson(request))
  if (!parsed.success) return parsed.response
  if (parsed.data.website) return ok({ received: true })

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('contacts').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      consent_privacy: parsed.data.privacyConsent,
    })
    if (error) throw error

    await sendOrQueue({
      to: parsed.data.email,
      kind: 'contatto_ricevuto',
      replyTo: process.env.SALON_EMAIL || undefined,
      content: contactReplyEmail(parsed.data.name, parsed.data.message),
    })

    return ok({ received: true })
  } catch {
    return fail('Non riesco a inviare il messaggio. Riprova tra poco.', 500)
  }
}
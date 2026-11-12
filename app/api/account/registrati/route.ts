import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStatelessClient } from '@/lib/supabase/auth-client'
import { setAuthCookies } from '@/lib/auth-cookies'
import { registerSchema } from '@/lib/validation/schemas'
import { parseBody, readJson, fail } from '@/lib/api'
import { baseUrl } from '@/lib/urls'
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimit(`registrati:${clientIp(request)}`, 5, 30 * 60 * 1000)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  const parsed = parseBody(registerSchema, await readJson(request))
  if (!parsed.success) return parsed.response
  const input = parsed.data

  const supabase = createStatelessClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${baseUrl(request)}/api/auth/callback?next=/area-clienti`,
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone || '',
        marketing_consent: input.marketingConsent,
      },
    },
  })

  if (error) {
    const already = /already registered|already exists/i.test(error.message)
    return fail(
      already ? 'Questo indirizzo email e gia registrato. Prova ad accedere.' : "Registrazione non riuscita. Riprova.",
      already ? 409 : 400,
    )
  }

  if (!data.user) return fail('Registrazione non riuscita. Riprova.', 400)

  const admin = createAdminClient()

  if (input.marketingConsent) {
    await admin
      .from('profiles')
      .update({ marketing_consent: true, marketing_consent_at: new Date().toISOString() })
      .eq('id', data.user.id)
  }

  if (data.session) {
    const response = NextResponse.json({
      ok: true,
      data: { redirectTo: '/area-clienti' },
    })
    setAuthCookies(response, data.session)
    return response
  }

  return NextResponse.json({ ok: true, data: { redirectTo: '/accedi?registrato=1' } })
}
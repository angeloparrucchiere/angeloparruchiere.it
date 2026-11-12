import { redirect } from 'next/navigation'
import { createStatelessClient } from '@/lib/supabase/auth-client'
import { setAuthCookies } from '@/lib/auth-cookies'
import { loginSchema } from '@/lib/validation/schemas'
import { safeNext } from '@/lib/urls'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const form = await request.formData()
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  const next = safeNext(form.get('next'), '/area-clienti')

  const limit = rateLimit(`accedi:${clientIp(request)}`, 10, 10 * 60 * 1000)
  if (!limit.allowed) {
    redirect('/accedi?errore=' + encodeURIComponent('Troppe richieste. Riprova tra qualche minuto.'))
  }

  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    redirect('/accedi?errore=' + encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dati non validi'))
  }

  const supabase = createStatelessClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.session) {
    redirect('/accedi?errore=' + encodeURIComponent('Email o password non corretti.'))
  }

  const response = redirect(next)
  setAuthCookies(response, data.session)
  return response
}
import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { baseUrl } from '@/lib/urls'
import { resetPasswordSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const form = await request.formData()
  const password = String(form.get('password') ?? '')
  const confirmPassword = String(form.get('confirmPassword') ?? '')
  const site = baseUrl(request)

  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })
  if (!parsed.success) {
    return NextResponse.redirect(
      site + '/reset-password?errore=' + encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dati non validi'),
    )
  }

  const supabase = await createAuthClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(
      site + '/reset-password?errore=' + encodeURIComponent('Link scaduto. Richiedi una nuova email di recupero.'),
    )
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    const message = /same password/i.test(error.message)
      ? 'La nuova password deve essere diversa da quella attuale.'
      : 'Non riesco a salvare la password. Riprova.'
    return NextResponse.redirect(site + '/reset-password?errore=' + encodeURIComponent(message))
  }

  return NextResponse.redirect(site + '/area-clienti?messaggio=password-aggiornata')
}

export const dynamic = 'force-dynamic'
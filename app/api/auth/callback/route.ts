import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { baseUrl, withQuery } from '@/lib/urls'

/** Callback del link nelle email: scambia il codice con una sessione. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/reset-password'
  const target = next === '/reset-password' ? '/reset-password' : '/area-clienti'

  if (!code) {
    return NextResponse.redirect(baseUrl(request) + withQuery('/accedi', { errore: 'Link non valido o scaduto.' }))
  }

  const supabase = await createAuthClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(baseUrl(request) + withQuery('/accedi', { errore: 'Link non valido o scaduto. Chiedine uno nuovo.' }))
  }

  return NextResponse.redirect(baseUrl(request) + target)
}

export const dynamic = 'force-dynamic'
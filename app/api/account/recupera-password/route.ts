import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { baseUrl } from '@/lib/urls'

export async function POST(request: Request) {
  const form = await request.formData()
  const email = String(form.get('email') ?? '').trim()
  const site = baseUrl(request)

  if (email) {
    const supabase = await createAuthClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/api/auth/callback?next=/reset-password`,
    })
  }

  return NextResponse.redirect(site + '/password-dimenticata?inviata=1')
}

export const dynamic = 'force-dynamic'
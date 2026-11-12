import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/db/types'

export const STAFF_COOKIE = 'ap_staff_ok'
const STAFF_TTL_SECONDS = 60 * 60 * 12

type StaffSession = {
  email: string
  profile: Profile
  authorization: string
}

/**
 * Il pannello staff non usa i cookie dell'area clienti: usa un token Supabase
 * conservato solo in memoria del browser e inviato a ogni richiesta come
 * Authorization: Bearer. Qui lo verifichiamo e controlliamo il profilo.
 */
export async function requireStaffSession(request: Request): Promise<StaffSession> {
  const authorization = request.headers.get('authorization') ?? ''
  if (!authorization.startsWith('Bearer ')) throw new Error('STAFF_UNAUTHENTICATED')

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(authorization.slice(7))
  if (error || !data.user) throw new Error('STAFF_UNAUTHENTICATED')

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name, phone, marketing_consent, created_at')
    .eq('id', data.user.id)
    .maybeSingle<Profile>()
  if (profileError) throw profileError
  if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
    throw new Error('STAFF_FORBIDDEN')
  }

  return { email: data.user.email ?? '', profile, authorization }
}

export function staffAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message === 'STAFF_UNAUTHENTICATED') {
    return NextResponse.json({ ok: false, error: 'Sessione staff scaduta. Accedi di nuovo.' }, { status: 401 })
  }
  if (message === 'STAFF_FORBIDDEN') {
    return NextResponse.json({ ok: false, error: 'Non hai i permessi staff.' }, { status: 403 })
  }
  return null
}

export const STAFF_MODE_COOKIE = STAFF_COOKIE
export const STAFF_MODE_MAX_AGE = STAFF_TTL_SECONDS
import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/db/types'

export type SessionUser = {
  id: string
  email: string
  profile: Profile
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const user = await getCurrentUser()
  if (!user?.email) return null

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name, phone, marketing_consent, created_at')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (error) throw error
  if (!profile) return null

  return { id: user.id, email: user.email, profile }
})

export const requireUser = cache(async (): Promise<SessionUser> => {
  const session = await getSessionUser()
  if (!session) throw new Error('UNAUTHENTICATED')
  return session
})

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const session = await requireUser()
  if (!roles.includes(session.profile.role)) throw new Error('FORBIDDEN')
  return session
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'staff' || role === 'admin'
}

export function displayName(profile: Pick<Profile, 'first_name' | 'last_name'>): string {
  return `${profile.first_name} ${profile.last_name}`.trim()
}
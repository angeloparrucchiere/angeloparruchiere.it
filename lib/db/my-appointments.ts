import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AppointmentWithStaff, AppointmentStatus } from '@/lib/db/types'

export const ACTIVE: AppointmentStatus[] = ['richiesto', 'confermato']

export async function getMyAppointments(customerId: string): Promise<AppointmentWithStaff[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .eq('customer_id', customerId)
    .order('starts_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as AppointmentWithStaff[]
}

export async function getMyAppointment(id: string, customerId: string): Promise<AppointmentWithStaff | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .eq('id', id)
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw error
  return (data as AppointmentWithStaff | null) ?? null
}
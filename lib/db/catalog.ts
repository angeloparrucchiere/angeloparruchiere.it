import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Availability, Service, Staff } from '@/lib/db/types'

export const getActiveServices = async (): Promise<Service[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .select('id, name, description, category, price_cents, duration_minutes, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as Service[]
}

export const getActiveStaff = async (): Promise<Staff[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('staff')
    .select('id, profile_id, display_name, title, bio, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as Staff[]
}

export const getAvailability = async (): Promise<Availability[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('availability')
    .select('id, staff_id, weekday, start_time, end_time')
  if (error) throw error
  return (data ?? []) as Availability[]
}

export const getStaffForService = async (serviceId: string): Promise<Staff[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('staff_services')
    .select('staff:staff!inner(id, profile_id, display_name, title, bio, is_active, sort_order)')
    .eq('service_id', serviceId)
  if (error) throw error

  return (data ?? [])
    .map((row) => (row as unknown as { staff: Staff }).staff)
    .filter((staff) => staff.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
}
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AppointmentStatus } from '@/lib/db/types'

const STATUS_LABEL: Record<string, string> = {
  richiesto: 'Richiesto',
  confermato: 'Confermato',
  completato: 'Completato',
  annullato: 'Annullato',
  rifiutato: 'Non confermato',
}

export type StaffAppointmentRow = {
  id: string
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  service_name: string
  service_price_cents: number
  notes: string
  staff_note: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  staff_name: string
}

type ProfileRow = { id: string; first_name: string; last_name: string; phone: string | null }
type StaffRow = { id: string; display_name: string }

function localDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

async function attachCustomers(rows: Record<string, unknown>[]) {
  const admin = createAdminClient()
  const ids = [...new Set(rows.map((row) => row.customer_id as string))]
  const profiles = new Map<string, ProfileRow>()
  const emails = new Map<string, string>()

  if (ids.length) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .in('id', ids)
    if (error) throw error
    for (const profile of data ?? []) profiles.set(profile.id, profile as ProfileRow)

    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (usersError) throw usersError
    for (const user of users.users) {
      if (user.email) emails.set(user.id, user.email)
    }
  }

  return rows.map((row) => {
    const profile = profiles.get(row.customer_id as string)
    const staff = row.staff as StaffRow | null
    return {
      id: row.id as string,
      status: row.status as AppointmentStatus,
      starts_at: row.starts_at as string,
      ends_at: row.ends_at as string,
      service_name: row.service_name as string,
      service_price_cents: row.service_price_cents as number,
      notes: (row.notes as string) ?? '',
      staff_note: (row.staff_note as string) ?? '',
      customer_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Cliente' : 'Cliente',
      customer_email: emails.get(row.customer_id as string) ?? '',
      customer_phone: profile?.phone ?? null,
      staff_name: staff?.display_name ?? 'Salone',
    } satisfies StaffAppointmentRow
  })
}

/** Agenda per giorno (ora di Roma): oggi di default. */
export async function getAgenda(dateKey: string): Promise<StaffAppointmentRow[]> {
  const admin = createAdminClient()
  const dayStart = new Date(`${dateKey}T00:00:00+01:00`)
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .order('starts_at')
    .limit(500)
  if (error) throw error

  const rows = (data ?? []).filter((row) => localDateKey(row.starts_at) === dateKey)
  void dayStart
  return attachCustomers(rows)
}

export async function getPendingRequests(limit = 40): Promise<StaffAppointmentRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .eq('status', 'richiesto')
    .gte('starts_at', new Date(Date.now() - 3 * 86400000).toISOString())
    .order('starts_at')
    .limit(limit)
  if (error) throw error
  return attachCustomers(data ?? [])
}

export async function getUpcomingAppointments(limit = 30): Promise<StaffAppointmentRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .in('status', ['richiesto', 'confermato'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(limit)
  if (error) throw error
  return attachCustomers(data ?? [])
}

export async function getAppointmentById(id: string): Promise<StaffAppointmentRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const [row] = await attachCustomers([data])
  return row ?? null
}

export async function updateAppointmentStatus(params: {
  id: string
  status: AppointmentStatus
  staffNote?: string
}) {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = { status: params.status }
  if (params.staffNote) patch.staff_note = params.staffNote
  const { data, error } = await admin
    .from('appointments')
    .update(patch)
    .eq('id', params.id)
    .select('*, staff:staff(id, display_name)')
    .single()
  if (error) throw error
  return data
}

export async function moveAppointment(params: {
  id: string
  startsAt: string
  endsAt: string
  staffId: string
}) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('appointments')
    .update({
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      staff_id: params.staffId,
      status: 'confermato',
    })
    .eq('id', params.id)
    .select('*, staff:staff(id, display_name)')
    .single()
  if (error) throw error
  return data
}

export async function updateAvailability(staffId: string, weekday: number, windows: Array<{ startTime: string; endTime: string }>) {
  const admin = createAdminClient()
  const { error: deleteError } = await admin
    .from('availability')
    .delete()
    .eq('staff_id', staffId)
    .eq('weekday', weekday)
  if (deleteError) throw deleteError

  if (windows.length) {
    const { error } = await admin.from('availability').insert(
      windows.map((window) => ({
        staff_id: staffId,
        weekday,
        start_time: `${window.startTime}:00`,
        end_time: `${window.endTime}:00`,
      })),
    )
    if (error) throw error
  }
}

export async function getStaffDirectory() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('staff')
    .select('id, display_name, title, is_active, sort_order')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getAvailabilityByStaff() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('availability').select('staff_id, weekday, start_time, end_time')
  if (error) throw error

  const grouped = new Map<string, Array<{ weekday: number; start_time: string; end_time: string }>>()
  for (const row of data ?? []) {
    grouped.set(row.staff_id, [...(grouped.get(row.staff_id) ?? []), row])
  }
  return grouped
}

export async function getActivity(limit = 40) {
  const admin = createAdminClient()
  const [{ data: emails }, { data: contacts }] = await Promise.all([
    admin
      .from('email_queue')
      .select('id, to_email, subject, status, attempts, created_at, sent_at, last_error')
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('contacts')
      .select('id, name, email, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  return {
    emails: (emails ?? []).map((email) => ({
      ...email,
      sent_at: email.sent_at ? String(email.sent_at) : null,
      last_error: email.last_error ? String(email.last_error) : null,
    })),
    contacts: contacts ?? [],
    labels: STATUS_LABEL,
  }
}
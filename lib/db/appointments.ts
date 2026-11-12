import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { BOOKING_RULES, getDaySlots } from '@/lib/db/availability'
import { getActiveServices, getStaffForService } from '@/lib/db/catalog'
import { emailAppointmentConfirmed, emailAppointmentRequested } from '@/lib/email/send'
import type { AppointmentStatus, AppointmentWithStaff } from '@/lib/db/types'

export type BookResult =
  | { ok: true; appointment: AppointmentWithStaff; confirmationUrl?: string }
  | { ok: false; error: string; status: number }

export async function bookAppointment(params: {
  customerId: string
  serviceId: string
  date: string
  startMinutes: number
  notes: string
}): Promise<BookResult> {
  const admin = createAdminClient()
  const services = await getActiveServices()
  const service = services.find((s) => s.id === params.serviceId)
  if (!service) return { ok: false, error: 'Servizio non disponibile', status: 404 }

  const staffList = await getStaffForService(service.id)
  const slots = await getDaySlots(service, staffList, params.date)
  const slot = slots.slots.find((s) => s.startMinutes === params.startMinutes)
  if (!slot) {
    return { ok: false, error: 'Questo orario non e piu disponibile. Scegline un altro.', status: 409 }
  }

  const { data: existing, error: existingError } = await admin
    .from('appointments')
    .select('id, starts_at, ends_at, status')
    .eq('customer_id', params.customerId)
    .in('status', ['richiesto', 'confermato'])
    .lt('starts_at', slot.endsAt)
    .gt('ends_at', slot.startsAt)
  if (existingError) throw existingError
  if (existing?.length) {
    return { ok: false, error: 'Hai gia un appuntamento in questo orario.', status: 409 }
  }
  void BOOKING_RULES

  let lastError = ''
  for (const staff of staffList) {
    const staffSlots = await getDaySlots(service, [staff], params.date)
    if (!staffSlots.slots.some((s) => s.startMinutes === params.startMinutes)) continue

    const { data, error } = await admin
      .from('appointments')
      .insert({
        customer_id: params.customerId,
        staff_id: staff.id,
        service_id: service.id,
        status: 'richiesto',
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        service_name: service.name,
        service_price_cents: service.price_cents,
        notes: params.notes,
      })
      .select('*, staff:staff(id, display_name)')
      .single()

    if (!error && data) {
      const appointment = data as AppointmentWithStaff
      const { data: authUser } = await admin.auth.admin.getUserById(params.customerId)
      const { data: profile } = await admin
        .from('profiles')
        .select('first_name')
        .eq('id', params.customerId)
        .maybeSingle()
      if (authUser.user?.email) {
        await emailAppointmentRequested({
          appointment,
          to: authUser.user.email,
          firstName: profile?.first_name ?? '',
        })
      }
      return { ok: true, appointment }
    }

    lastError = error?.message ?? ''
    if (error?.code !== '23P01') break
  }

  return {
    ok: false,
    error: lastError
      ? 'Qualcuno ha appena preso questo orario. Scegline un altro.'
      : 'Nessun parrucchiere disponibile a quest orario.',
    status: 409,
  }
}

export async function confirmAppointment(appointment: AppointmentWithStaff, firstName: string, email: string) {
  return emailAppointmentConfirmed({ appointment, to: email, firstName })
}

export const ACTIVE_STATUSES: AppointmentStatus[] = ['richiesto', 'confermato']
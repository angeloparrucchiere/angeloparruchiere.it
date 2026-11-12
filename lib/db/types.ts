export type UserRole = 'cliente' | 'staff' | 'admin'
export type AppointmentStatus = 'richiesto' | 'confermato' | 'completato' | 'annullato' | 'rifiutato'
export type EmailStatus = 'in_coda' | 'inviata' | 'fallita'

export type Profile = {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  marketing_consent: boolean
  created_at: string
}

export type Service = {
  id: string
  name: string
  description: string
  category: string
  price_cents: number
  duration_minutes: number
  sort_order: number
  is_active: boolean
}

export type Staff = {
  id: string
  profile_id: string | null
  display_name: string
  title: string
  bio: string
  is_active: boolean
  sort_order: number
}

export type Availability = {
  id: string
  staff_id: string
  weekday: number
  start_time: string
  end_time: string
}

export type Appointment = {
  id: string
  customer_id: string
  staff_id: string
  service_id: string
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  service_name: string
  service_price_cents: number
  notes: string
  staff_note: string
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

export type AppointmentWithStaff = Appointment & {
  staff: Pick<Staff, 'id' | 'display_name'> | null
}

export type StaffAppointment = Appointment & {
  staff: Pick<Staff, 'id' | 'display_name'> | null
  profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'phone'> | null
}

export type SlotResult = {
  startMinutes: number
  startsAt: string
  endsAt: string
}

export type DaySlots = {
  date: string
  slots: SlotResult[]
  staffIds: string[]
}
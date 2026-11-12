import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { resendConfigured, sendEmail } from '@/lib/email/resend'
import { appointmentReminderEmail, requestReceivedEmail, appointmentConfirmedEmail } from '@/lib/email/templates'
import type { EmailContent } from '@/lib/email/templates'
import type { AppointmentWithStaff } from '@/lib/db/types'

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Salone Angeloparruchiere <noreply@angeloparruchiere.it>'

type QueueInput = {
  to: string
  content: EmailContent
  kind: string
  replyTo?: string
}

type SendResult = { queued: boolean; sent: boolean; skipped: boolean }

/** Mette l'email in coda: la svuota subito questa richiesta, o il keepalive. */
async function enqueue(input: QueueInput, status: 'in_coda' = 'in_coda') {
  const admin = createAdminClient()
  const { error } = await admin.from('email_queue').insert({
    to_email: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    reply_to: input.replyTo ?? null,
    kind: input.kind,
    status,
  })
  if (error) throw error
}

async function recordSent(input: QueueInput, appointmentId: string | null, resendId?: string) {
  const admin = createAdminClient()
  await admin.from('email_queue').insert({
    to_email: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    reply_to: input.replyTo ?? null,
    kind: input.kind,
    appointment_id: appointmentId,
    status: 'inviata',
    sent_at: new Date().toISOString(),
    attempts: 1,
    last_error: resendId ? `resend:${resendId}` : null,
  })
}

/**
 * Invio immediato se Resend e' configurato, altrimenti coda.
 * La coda viene svuotata dal keepalive (o dalla route di debug in locale).
 */
export async function sendOrQueue(input: QueueInput): Promise<SendResult> {
  if (resendConfigured()) {
    const result = await sendEmail({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.content.subject,
      html: input.content.html,
      text: input.content.text,
      replyTo: input.replyTo,
    })
    if (result.ok) {
      await recordSent(input, null, result.id)
      return { queued: false, sent: true, skipped: false }
    }
  }
  await enqueue(input)
  return { queued: true, sent: false, skipped: false }
}

/** Una sola email per prenotazione e tipo: niente doppioni su azioni ripetute. */
export async function sendOrQueueUnique(
  appointmentId: string,
  input: QueueInput,
): Promise<SendResult> {
  const admin = createAdminClient()
  const { data: existing, error } = await admin
    .from('email_queue')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('kind', input.kind)
    .maybeSingle()
  if (error) throw error
  if (existing) return { queued: false, sent: false, skipped: true }

  if (resendConfigured()) {
    const result = await sendEmail({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.content.subject,
      html: input.content.html,
      text: input.content.text,
      replyTo: input.replyTo,
    })
    if (result.ok) {
      await recordSent(input, appointmentId, result.id)
      return { queued: false, sent: true, skipped: false }
    }
  }

  const { error: insertError } = await admin.from('email_queue').insert({
    to_email: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    reply_to: input.replyTo ?? null,
    kind: input.kind,
    appointment_id: appointmentId,
  })
  if (insertError) throw insertError
  return { queued: true, sent: false, skipped: false }
}

type AppointmentEmailArgs = {
  appointment: AppointmentWithStaff
  to: string
  firstName: string
}

function optionalEmail(to: string): string | undefined {
  return to || undefined
}

function templateData({ appointment, firstName }: AppointmentEmailArgs) {
  return {
    firstName: firstName || 'ciao',
    serviceName: appointment.service_name,
    priceCents: appointment.service_price_cents,
    staffName: appointment.staff?.display_name ?? 'Salone',
    startsAt: appointment.starts_at,
  }
}

export async function emailAppointmentRequested(args: AppointmentEmailArgs) {
  return sendOrQueueUnique(args.appointment.id, {
    to: args.to,
    kind: 'richiesta_ricevuta',
    content: requestReceivedEmail(templateData(args)),
  })
}

export async function emailAppointmentConfirmed(args: AppointmentEmailArgs) {
  return sendOrQueueUnique(args.appointment.id, {
    to: args.to,
    kind: 'confermato',
    content: appointmentConfirmedEmail(templateData(args)),
  })
}

export async function emailReminderUnique(args: AppointmentEmailArgs) {
  return sendOrQueueUnique(args.appointment.id, {
    to: args.to,
    kind: 'promemoria',
    content: appointmentReminderEmail(templateData(args)),
  })
}

export { optionalEmail }

/**
 * Promemoria per gli appuntamenti confermati tra 24 e 48 ore.
 * reminder_sent_at evita i doppi invii tra un giro e l'altro.
 */
export async function sendPendingReminders(now: Date = new Date()) {
  const admin = createAdminClient()
  const from = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const to = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from('appointments')
    .select('*, staff:staff(id, display_name), profile:profiles!appointments_customer_id_fkey(first_name)')
    .eq('status', 'confermato')
    .is('reminder_sent_at', null)
    .gte('starts_at', from)
    .lte('starts_at', to)
  if (error) throw error

  let sent = 0
  for (const row of data ?? []) {
    const appointment = row as unknown as AppointmentWithStaff & {
      profile: { first_name: string } | null
    }
    const { data: authUser } = await admin.auth.admin.getUserById(appointment.customer_id)
    const email = authUser.user?.email
    if (!email) continue

    await emailReminderUnique({
      appointment,
      to: email,
      firstName: appointment.profile?.first_name ?? '',
    })
    await admin
      .from('appointments')
      .update({ reminder_sent_at: now.toISOString() })
      .eq('id', appointment.id)
    sent += 1
  }
  return sent
}
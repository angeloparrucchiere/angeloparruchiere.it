// Manutenzione periodica del progetto Supabase (piano Free).
// Chiamata dal workflow .github/workflows/supabase-keepalive.yml.
//
// Fa lavoro utile, non un ping a vuoto:
//  1. svuota la coda email verso Resend (con retry e limite tentativi)
//  2. rifiuta gli appuntamenti "richiesto" mai confermati dopo 48 ore
//  3. chiude gli appuntamenti completati da piu di 30 giorni
//  4. rimuove i contatti archiviati piu vecchi di un anno
//  5. tocca le tabelle principali con una query reale
//
// Lettura dei segreti: prima i secret delle Edge Function
// (supabase secrets set ...), poi quelli integrati di Supabase.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type PendingEmail = {
  id: string
  to_email: string
  subject: string
  html: string
  text: string
  reply_to: string | null
  appointment_id: string | null
}

const FROM_FALLBACK = 'Salone Angeloparruchiere <noreply@angeloparruchiere.it>'
const MAX_ATTEMPTS = 3
const PENDING_EXPIRATION_DAYS = 2
const COMPLETED_RETENTION_DAYS = 30
const CONTACTS_RETENTION_DAYS = 365

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function env(...names: string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim()
    if (value) return value
  }
  return ''
}

Deno.serve(async (req) => {
  const url = env('SUPABASE_URL', 'SUPABASE_PUBLIC_URL')
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    return json({ ok: false, error: 'Configurazione Supabase mancante' }, 500)
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const results = {
      email: await dispatchEmails(admin),
      pendingExpired: 0,
      completedClosed: 0,
      contactsPruned: 0,
      touched: null as null | { services: number; staff: number; appointments: number },
    }

    const expireLimit = new Date(
      Date.now() - PENDING_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { data: expired, error: expireError } = await admin
      .from('appointments')
      .update({ status: 'rifiutato', staff_note: 'Richiesta scaduta: non confermata entro 48 ore.' })
      .eq('status', 'richiesto')
      .lt('starts_at', expireLimit)
      .select('id')
    if (expireError) throw expireError
    results.pendingExpired = expired?.length ?? 0

    const closeLimit = new Date(
      Date.now() - COMPLETED_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { data: closed, error: closeError } = await admin
      .from('appointments')
      .update({ status: 'completato' })
      .eq('status', 'confermato')
      .lt('ends_at', closeLimit)
      .select('id')
    if (closeError) throw closeError
    results.completedClosed = closed?.length ?? 0

    const contactsLimit = new Date(
      Date.now() - CONTACTS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { data: pruned, error: pruneError } = await admin
      .from('contacts')
      .delete()
      .eq('status', 'archiviato')
      .lt('created_at', contactsLimit)
      .select('id')
    if (pruneError) throw pruneError
    results.contactsPruned = pruned?.length ?? 0

    const [services, staff, appointments] = await Promise.all([
      admin.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('appointments').select('id', { count: 'exact', head: true }),
    ])
    results.touched = {
      services: services.count ?? 0,
      staff: staff.count ?? 0,
      appointments: appointments.count ?? 0,
    }

    return json({ ok: true, at: new Date().toISOString(), ...results })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return json({ ok: false, error: message }, 500)
  }
})

async function dispatchEmails(admin: SupabaseClient) {
  const resendKey = env('RESEND_API_KEY')
  const from = env('RESEND_FROM_EMAIL') || FROM_FALLBACK

  const { data: pending, error } = await admin
    .from('email_queue')
    .select('id, to_email, subject, html, text, reply_to, appointment_id')
    .eq('status', 'in_coda')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(40)
  if (error) throw error

  const summary = { pending: pending?.length ?? 0, sent: 0, failed: 0, skipped: 0 }
  if (!pending?.length) return summary

  if (!resendKey) {
    summary.skipped = pending.length
    return summary
  }

  for (const item of pending as PendingEmail[]) {
    let emailId: string
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [item.to_email],
          subject: item.subject,
          html: item.html,
          text: item.text || undefined,
          reply_to: item.reply_to || undefined,
        }),
      })
      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Resend ${response.status}: ${detail.slice(0, 400)}`)
      }
      const body = (await response.json()) as { id?: string }
      emailId = body.id ?? ''
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      await retryOrFail(admin, item.id, item.appointment_id, message)
      summary.failed += 1
      continue
    }

    const { error: updateError } = await admin
      .from('email_queue')
      .update({
        status: 'inviata',
        sent_at: new Date().toISOString(),
        attempts: 1,
        last_error: emailId ? `resend:${emailId}` : null,
      })
      .eq('id', item.id)
    if (updateError) throw updateError
    summary.sent += 1
  }

  return summary
}

async function retryOrFail(
  admin: SupabaseClient,
  id: string,
  appointmentId: string | null,
  message: string,
) {
  const { data: row } = await admin
    .from('email_queue')
    .select('attempts')
    .eq('id', id)
    .maybeSingle()
  const attempts = (row?.attempts ?? 0) + 1
  const failed = attempts >= MAX_ATTEMPTS

  const patch: Record<string, unknown> = {
    attempts,
    last_error: message.slice(0, 500),
    status: failed ? 'fallita' : 'in_coda',
  }

  const { error } = await admin.from('email_queue').update(patch).eq('id', id)
  if (error) throw error

  if (appointmentId) {
    const { error: touchError } = await admin
      .from('appointments')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
    if (touchError) throw touchError
  }

}
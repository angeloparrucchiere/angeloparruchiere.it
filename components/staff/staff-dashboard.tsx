'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { STATUS_CLASS, STATUS_LABEL, formatDateTime, formatPrice } from '@/lib/format'
import { createBrowserSupabase } from '@/lib/supabase/browser'

const NAV = [
  { href: '/staff/prenotazioni', label: 'Prenotazioni' },
  { href: '/staff/disponibilita', label: 'Disponibilita' },
  { href: '/staff/attivita', label: 'Attivita' },
]

export type StaffRow = {
  id: string
  status: string
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

type Props = {
  pending: StaffRow[]
  agenda: StaffRow[]
  initialDate: string
}

export function StaffDashboard({ pending, agenda, initialDate }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>('loading')
  const [email, setEmail] = useState('')
  const [path, setPath] = useState('')
  const [date, setDate] = useState(initialDate)

  useEffect(() => {
    setPath(window.location.pathname)
    const supabase = createBrowserSupabase()
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          window.location.replace('/staff/login')
          return
        }
        const role = (data.session.user.app_metadata?.role as string | undefined) ?? 'cliente'
        if (role !== 'staff' && role !== 'admin') {
          window.location.replace('/staff/login?errore=not-staff')
          return
        }
        setEmail(data.session.user.email ?? '')
        setState('ready')
      })
      .catch(() => setState('denied'))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!next) {
        window.location.replace('/staff/login')
        return
      }
      setState('ready')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    window.location.replace('/staff/login')
  }

  return (
    <div className='min-h-screen text-paper md:flex'>
      <aside className='border-b border-paper/10 p-5 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r md:p-6'>
        <div className='space-y-1'>
          <p className='font-display text-xl tracking-[0.16em]'>ANGELO.</p>
          <p className='text-[0.62rem] uppercase tracking-[0.2em] text-paper/50'>Pannello staff</p>
        </div>
        <nav className='mt-6 flex gap-1 overflow-x-auto md:flex-col' aria-label='Sezioni staff'>
          {NAV.map((item) => {
            const active = path === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm ${active ? 'bg-paper text-ink' : 'text-paper/70 hover:bg-paper/10'}`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>
        <div className='mt-6 hidden space-y-3 border-t border-paper/10 pt-6 md:block'>
          <p className='truncate text-xs text-paper/50'>{email}</p>
          <a href='/' className='block text-xs text-paper/70 underline hover:text-gold-soft'>Vai al sito</a>
          <button type='button' onClick={signOut} className='text-xs text-paper/70 underline hover:text-gold-soft'>
            Esci
          </button>
        </div>
      </aside>

      <div className='flex-1 p-4 md:p-8'>
        <div className='mx-auto max-w-5xl space-y-8'>
          {state !== 'ready' ? (
            <>
              <p className='text-sm uppercase tracking-[0.2em] text-paper/60'>
                {state === 'loading' ? 'Carico il pannello...' : 'Controlla il login staff...'}
              </p>
              <div className='sr-only'>{email}</div>
            </>
          ) : (
            <>
              <header className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-[0.2em] text-gold-soft'>Agenda</p>
                  <h1 className='text-3xl'>Prenotazioni</h1>
                </div>
                <div className='flex items-center gap-2'>
                  <label className='text-xs uppercase tracking-[0.14em] text-paper/50' htmlFor='staff-date'>Giorno</label>
                  <input
                    id='staff-date'
                    type='date'
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value)
                      window.location.assign(`/staff/prenotazioni?data=${event.target.value}`)
                    }}
                    className='rounded-lg border border-paper/20 bg-ink px-3 py-2 text-sm text-paper'
                  />
                </div>
              </header>

              <section className='space-y-3'>
                <h2 className='text-xl'>In attesa di conferma ({pending.length})</h2>
                {pending.length === 0 ? (
                  <p className='rounded-lg border border-paper/10 bg-paper/5 p-4 text-sm text-paper/60'>Nessuna richiesta in attesa.</p>
                ) : (
                  <div className='grid gap-3 md:grid-cols-2'>
                    {pending.map((row) => (
                      <RequestCard key={row.id} row={row} />
                    ))}
                  </div>
                )}
              </section>

              <section className='space-y-3'>
                <h2 className='text-xl'>Agenda del giorno ({agenda.length})</h2>
                {agenda.length === 0 ? (
                  <p className='rounded-lg border border-paper/10 bg-paper/5 p-4 text-sm text-paper/60'>Nessun appuntamento per questo giorno.</p>
                ) : (
                  <div className='space-y-3'>
                    {agenda.map((row) => (
                      <AppointmentCard key={row.id} row={row} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function timeOf(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(new Date(iso))
}

async function callStaff(action: string, appointmentId: string) {
  const supabase = createBrowserSupabase()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessione scaduta. Ricarica la pagina e accedi di nuovo.')
  const response = await fetch('/api/staff/appuntamenti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ appointmentId, action }),
  })
  const body = await response.json()
  if (!response.ok || !body.ok) throw new Error(body.error ?? 'Operazione non riuscita.')
}

function ActionRow({ row, actions }: { row: StaffRow; actions: Array<{ key: string; label: string }> }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function run(action: string) {
    setBusy(action)
    setError('')
    try {
      await callStaff(action, row.id)
      window.location.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Errore')
      setBusy('')
    }
  }

  return (
    <div className='mt-3 space-y-2'>
      {error && <p className='text-xs text-red-300' role='alert'>{error}</p>}
      <div className='flex flex-wrap gap-2'>
        {actions.map((action) => (
          <button
            key={action.key}
            type='button'
            onClick={() => run(action.key)}
            disabled={Boolean(busy)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${
              action.key === 'conferma' || action.key === 'completa'
                ? 'border-gold-soft text-gold-soft hover:bg-gold-soft hover:text-ink'
                : 'border-paper/25 text-paper/70 hover:border-red-300 hover:text-red-300'
            } ${busy === action.key ? 'opacity-50' : ''}`}
          >
            {busy === action.key ? '...' : action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RequestCard({ row }: { row: StaffRow }) {
  return (
    <article className='rounded-xl border border-paper/15 bg-paper/5 p-4'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='text-xs uppercase tracking-[0.14em] text-gold-soft'>{formatDateTime(row.starts_at)}</p>
          <p className='mt-1 text-lg'>{row.service_name}</p>
          <p className='text-sm text-paper/70'>{row.customer_name}</p>
          <p className='text-xs text-paper/50'>{row.customer_email}{row.customer_phone ? ` · ${row.customer_phone}` : ''}</p>
        </div>
        <p className='text-sm text-gold-soft'>{formatPrice(row.service_price_cents)}</p>
      </div>
      {row.notes && <p className='mt-2 rounded-lg bg-ink px-3 py-2 text-xs text-paper/70'>{row.notes}</p>}
      <ActionRow
        row={row}
        actions={[
          { key: 'conferma', label: 'Conferma' },
          { key: 'rifiuta', label: 'Rifiuta' },
        ]}
      />
    </article>
  )
}

function AppointmentCard({ row }: { row: StaffRow }) {
  return (
    <article className='rounded-xl border border-paper/15 bg-paper/5 p-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs uppercase tracking-[0.14em] text-gold-soft'>
            {timeOf(row.starts_at)} - {timeOf(row.ends_at)} · {row.staff_name}
          </p>
          <p className='mt-1 text-lg'>{row.service_name}</p>
          <p className='text-sm text-paper/70'>{row.customer_name}{row.customer_phone ? ` · ${row.customer_phone}` : ''}</p>
          <p className='text-xs text-paper/50'>{row.customer_email}</p>
        </div>
        <span className={`status-pill w-fit ${STATUS_CLASS[row.status] ?? ''}`}>{STATUS_LABEL[row.status] ?? row.status}</span>
      </div>
      {row.notes && <p className='mt-2 rounded-lg bg-ink px-3 py-2 text-xs text-paper/70'>{row.notes}</p>}
      {(row.status === 'richiesto' || row.status === 'confermato') && (
        <ActionRow
          row={row}
          actions={
            row.status === 'richiesto'
              ? [
                  { key: 'conferma', label: 'Conferma' },
                  { key: 'rifiuta', label: 'Rifiuta' },
                ]
              : [
                  { key: 'completa', label: 'Completato' },
                  { key: 'annulla', label: 'Annulla' },
                ]
          }
        />
      )}
    </article>
  )
}

export function StaffPageFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className='space-y-3'>
      <p className='text-xs uppercase tracking-[0.2em] text-gold-soft'>{title}</p>
      <h1 className='text-3xl'>{subtitle}</h1>
      {children}
    </div>
  )
}
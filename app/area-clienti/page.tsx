import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser, displayName } from '@/lib/auth'
import { getMyAppointments } from '@/lib/db/my-appointments'
import { formatDateTime, formatPrice, STATUS_CLASS, STATUS_LABEL } from '@/lib/format'

export const metadata: Metadata = {
  title: 'La tua area clienti',
  robots: { index: false },
}

type Search = Promise<{ messaggio?: string }>

export default async function AreaClientiPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams
  const session = await getSessionUser().catch(() => null)
  if (!session) redirect('/accedi?next=/area-clienti')

  const appointments = await getMyAppointments(session.id).catch(() => [])
  const now = Date.now()
  const upcoming = appointments
    .filter((item) => new Date(item.starts_at).getTime() >= now && ['richiesto', 'confermato'].includes(item.status))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const upcomingIds = new Set(upcoming.map((item) => item.id))
  const past = appointments.filter((item) => !upcomingIds.has(item.id)).slice(0, 10)

  return (
    <div className='container-site py-14'>
      <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-2'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl sm:text-5xl'>Ciao, {session.profile.first_name || 'bentornato'}.</h1>
          <p className='text-sm text-muted'>
            {displayName(session.profile) || session.email} · {session.profile.role === 'cliente' ? 'Cliente' : session.profile.role}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Link href='/area-clienti/prenota' className='btn-primary'>Nuovo appuntamento</Link>
          <Link href='/area-clienti/profilo' className='btn-ghost'>Profilo</Link>
        </div>
      </div>

      {params.messaggio === 'password-aggiornata' && (
        <p className='mt-6 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success' role='status'>
          Password aggiornata. Sei connesso con la nuova password.
        </p>
      )}

      <div className='mt-10 grid gap-4 sm:grid-cols-3'>
        <div className='card'>
          <p className='eyebrow'>Prossimi</p>
          <p className='mt-2 font-display text-4xl'>{upcoming.length}</p>
        </div>
        <div className='card'>
          <p className='eyebrow'>Visite</p>
          <p className='mt-2 font-display text-4xl'>{past.length}</p>
        </div>
        <div className='card'>
          <p className='eyebrow'>Stato</p>
          <p className='mt-2 font-display text-2xl'>
            {upcoming.some((item) => item.status === 'confermato') ? 'Confermato' : upcoming.length ? 'In attesa' : 'Libero'}
          </p>
        </div>
      </div>

      <section className='mt-12 space-y-4'>
        <div className='flex items-baseline justify-between'>
          <h2 className='text-2xl'>Prossimi appuntamenti</h2>
          <Link href='/area-clienti/prenotazioni' className='text-xs uppercase tracking-[0.14em] text-muted hover:text-gold'>Tutti</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className='card space-y-3'>
            <p className='text-sm text-muted'>Non hai appuntamenti in programma. Ne vuoi uno?</p>
            <Link href='/area-clienti/prenota' className='btn-secondary w-fit'>Prenota</Link>
          </div>
        ) : (
          <ul className='space-y-3'>
            {upcoming.map((item) => (
              <li key={item.id} className='card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <p className='font-display text-xl'>{item.service_name}</p>
                  <p className='text-sm text-muted'>
                    {formatDateTime(item.starts_at)} · {item.staff?.display_name ?? 'Salone'} · {formatPrice(item.service_price_cents)}
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <span className={`status-pill border ${STATUS_CLASS[item.status] ?? ''}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <Link href='/area-clienti/prenotazioni' className='text-xs uppercase tracking-[0.14em] hover:text-gold'>Gestisci</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className='mt-12 space-y-4'>
          <h2 className='text-2xl'>Storico</h2>
          <ul className='divide-y divide-line'>
            {past.map((item) => (
              <li key={item.id} className='flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='font-medium'>{item.service_name}</p>
                  <p className='text-sm text-muted'>{formatDateTime(item.starts_at)} · {item.staff?.display_name ?? 'Salone'}</p>
                </div>
                <span className={`status-pill border w-fit ${STATUS_CLASS[item.status] ?? ''}`}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
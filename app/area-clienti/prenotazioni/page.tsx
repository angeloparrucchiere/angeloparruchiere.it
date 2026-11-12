import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getMyAppointments } from '@/lib/db/my-appointments'
import { formatDateTime, formatPrice } from '@/lib/format'
import { AppointmentActions } from '@/components/area-clienti/appointment-actions'

export const metadata: Metadata = {
  title: 'I miei appuntamenti',
  robots: { index: false },
}

export default async function PrenotazioniPage() {
  const session = await getSessionUser().catch(() => null)
  if (!session) redirect('/accedi?next=/area-clienti/prenotazioni')

  const appointments = await getMyAppointments(session.id).catch(() => [])
  const active = appointments
    .filter((item) => ['richiesto', 'confermato'].includes(item.status))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const history = appointments.filter((item) => !['richiesto', 'confermato'].includes(item.status))

  return (
    <div className='container-site py-14'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl'>I miei appuntamenti.</h1>
        </div>
        <Link href='/area-clienti/prenota' className='btn-primary w-fit'>Nuovo appuntamento</Link>
      </div>

      <section className='mt-10 space-y-4'>
        <h2 className='text-2xl'>In programma</h2>
        {active.length === 0 ? (
          <p className='text-sm text-muted'>Nessun appuntamento in programma.</p>
        ) : (
          <ul className='space-y-3'>
            {active.map((item) => (
              <li key={item.id} className='card space-y-3'>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between'>
                  <p className='font-display text-2xl'>{item.service_name}</p>
                  <p className='text-sm text-muted'>{formatDateTime(item.starts_at)}</p>
                </div>
                {item.notes && <p className='text-xs text-muted'>Note: {item.notes}</p>}
                <AppointmentActions
                  appointment={{
                    id: item.id,
                    starts_at: item.starts_at,
                    status: item.status,
                    service_name: item.service_name,
                    service_price_cents: item.service_price_cents,
                    staff_name: item.staff?.display_name ?? 'Salone',
                  }}
                  canMove
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className='mt-12 space-y-4'>
        <h2 className='text-2xl'>Storico</h2>
        {history.length === 0 ? (
          <p className='text-sm text-muted'>Ancora nessuna visita registrata.</p>
        ) : (
          <ul className='divide-y divide-line'>
            {history.map((item) => (
              <li key={item.id} className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='font-medium'>{item.service_name}</p>
                  <p className='text-sm text-muted'>
                    {formatDateTime(item.starts_at)} · {formatPrice(item.service_price_cents)}
                  </p>
                </div>
                <AppointmentActions
                  appointment={{
                    id: item.id,
                    starts_at: item.starts_at,
                    status: item.status,
                    service_name: item.service_name,
                    service_price_cents: item.service_price_cents,
                    staff_name: item.staff?.display_name ?? 'Salone',
                  }}
                  canMove={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
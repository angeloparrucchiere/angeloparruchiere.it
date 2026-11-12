import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getMyAppointment } from '@/lib/db/my-appointments'
import { formatDateTime, formatPrice, STATUS_LABEL } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Richiesta inviata',
  robots: { index: false },
}

type Search = Promise<{ id?: string }>

export default async function ConfermaPage({ searchParams }: { searchParams: Search }) {
  const session = await getSessionUser().catch(() => null)
  if (!session) redirect('/accedi')

  const params = await searchParams
  const appointment = params.id ? await getMyAppointment(params.id, session.id).catch(() => null) : null

  return (
    <div className='container-site flex min-h-[65vh] items-center justify-center py-14'>
      <div className='w-full max-w-xl space-y-6 text-center'>
        <p className='font-display text-4xl text-gold'>✓</p>
        <h1 className='text-4xl'>Richiesta inviata.</h1>
        <p className='text-sm text-muted'>
          Ti scriviamo una email appena il salone conferma l&apos;appuntamento. Trovi la richiesta tra i tuoi
          appuntamenti, in attesa.
        </p>

        {appointment && (
          <div className='card space-y-2 text-left'>
            <p className='eyebrow'>Il tuo appuntamento</p>
            <p className='font-display text-2xl'>{appointment.service_name}</p>
            <p className='text-sm text-muted'>
              {formatDateTime(appointment.starts_at)} · {appointment.staff?.display_name ?? 'Salone'} ·{' '}
              {formatPrice(appointment.service_price_cents)}
            </p>
            <p className='text-xs uppercase tracking-[0.14em] text-muted'>Stato: {STATUS_LABEL[appointment.status] ?? appointment.status}</p>
          </div>
        )}

        <div className='flex flex-wrap justify-center gap-3'>
          <Link href='/area-clienti/prenotazioni' className='btn-primary'>I miei appuntamenti</Link>
          <Link href='/area-clienti' className='btn-ghost'>Area clienti</Link>
        </div>
      </div>
    </div>
  )
}
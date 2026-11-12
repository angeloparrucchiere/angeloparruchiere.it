import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BookingWidget } from '@/components/prenotazioni/booking-widget'
import { getActiveServices } from '@/lib/db/catalog'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Nuovo appuntamento',
  robots: { index: false },
}

export default async function PrenotaAreaPage() {
  const session = await getSessionUser().catch(() => null)
  if (!session) redirect('/accedi?next=/area-clienti/prenota')

  const services = await getActiveServices().catch(() => [])

  return (
    <div className='container-site py-14'>
      <div className='max-w-2xl space-y-3'>
        <p className='eyebrow'>Area clienti</p>
        <h1 className='text-4xl sm:text-5xl'>Nuovo appuntamento.</h1>
        <p className='text-sm leading-relaxed text-muted'>
          Scegli servizio, giorno e ora. La richiesta arriva subito al salone, che la conferma.
        </p>
      </div>
      <div className='mt-10 max-w-3xl'>
        <BookingWidget services={services} mode='client' />
      </div>
    </div>
  )
}
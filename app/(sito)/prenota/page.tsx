import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BookingWidget } from '@/components/prenotazioni/booking-widget'
import { getActiveServices } from '@/lib/db/catalog'
import { getSessionUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Prenota un appuntamento',
  description: 'Scegli servizio, giorno e orario. La richiesta arriva subito al salone.',
}

type Search = Promise<{ servizio?: string }>

export default async function PrenotaPage({ searchParams }: { searchParams: Search }) {
  const session = await getSessionUser().catch(() => null)
  if (session) redirect('/area-clienti/prenota')

  const params = await searchParams
  const services = await getActiveServices().catch(() => [])

  return (
    <div className='container-site py-16'>
      <div className='max-w-2xl space-y-4'>
        <p className='eyebrow'>Prenotazioni</p>
        <h1 className='text-5xl sm:text-6xl'>Scegli il tuo momento.</h1>
        <p className='text-sm leading-relaxed text-muted'>
          Seleziona il servizio, il giorno e l&apos;orario. Riceverai una email di conferma quando il
          salone avra approvato la richiesta.
        </p>
      </div>
      <div className='mt-10 max-w-3xl'>
        <BookingWidget services={services} initialServiceId={params.servizio} mode='guest' />
      </div>
    </div>
  )
}
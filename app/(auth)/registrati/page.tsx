import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Registrati',
  robots: { index: false },
}

type Search = Promise<{ errore?: string; servizio?: string }>

export default async function RegistratiPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams

  return (
    <div className='container-site py-16'>
      <div className='grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start'>
        <div className='space-y-4 md:sticky md:top-24'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-5xl'>Crea il tuo account.</h1>
          <p className='max-w-sm text-sm leading-relaxed text-muted'>
            Con un account puoi prenotare in pochi clic, annullare o spostare un appuntamento e tenere sotto
            controllo le tue visite.
          </p>
          <ul className='space-y-2 text-sm text-muted'>
            <li>Conferme e promemoria via email</li>
            <li>Lo storico delle tue prenotazioni</li>
            <li>Nessuna newsletter senza il tuo consenso</li>
          </ul>
        </div>
        <div className='card'>
          {params.errore && (
            <p className='mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>
              {params.errore}
            </p>
          )}
          <RegisterForm serviceId={params.servizio} />
          <p className='mt-5 text-center text-sm text-muted'>
            Hai gia un account? <Link href='/accedi' className='font-medium text-ink underline hover:text-gold'>Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
import type { Metadata } from 'next'
import { PasswordField } from '@/components/auth/password-field'

export const metadata: Metadata = {
  title: 'Password dimenticata',
  robots: { index: false },
}

type Search = Promise<{ inviata?: string; errore?: string }>

export default async function PasswordDimenticataPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams

  return (
    <div className='container-site flex min-h-[70vh] items-center justify-center py-16'>
      <div className='w-full max-w-md space-y-6'>
        <div className='space-y-3 text-center'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl'>Password dimenticata.</h1>
        </div>

        {params.inviata ? (
          <div className='card space-y-2' role='status'>
            <p className='font-display text-2xl'>Controlla la mail</p>
            <p className='text-sm text-muted'>
              Se l&apos;indirizzo e registrato ricevi un link per scegliere una nuova password. Controlla anche
              la cartella spam.
            </p>
          </div>
        ) : (
          <form action='/api/account/recupera-password' method='post' className='card space-y-4'>
            <div>
              <label className='field-label' htmlFor='forgot-email'>Email del tuo account</label>
              <input id='forgot-email' name='email' type='email' autoComplete='email' required className='field-input' />
            </div>
            <button type='submit' className='btn-primary w-full'>Invia il link</button>
          </form>
        )}

        <p className='text-center text-xs text-muted'>
          <a href='/accedi' className='underline hover:text-gold'>Torna al login</a>
        </p>
        <div className='sr-only'>
          <PasswordField id='forgot-decoy' name='decoy' required={false} />
        </div>
      </div>
    </div>
  )
}
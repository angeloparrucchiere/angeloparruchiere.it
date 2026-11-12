import type { Metadata } from 'next'
import Link from 'next/link'
import { PasswordField } from '@/components/auth/password-field'

export const metadata: Metadata = {
  title: 'Accedi',
  robots: { index: false },
}

type Search = Promise<{ errore?: string; next?: string }>

export default async function AccediPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams

  return (
    <div className='container-site flex min-h-[70vh] items-center justify-center py-16'>
      <div className='w-full max-w-md space-y-6'>
        <div className='space-y-3 text-center'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl'>Bentornato.</h1>
          <p className='text-sm text-muted'>Accedi per gestire i tuoi appuntamenti.</p>
        </div>

        {params.errore && (
          <p className='rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>
            {params.errore}
          </p>
        )}

        <form action='/api/account/accedi' method='post' className='card space-y-4'>
          <input type='hidden' name='next' value={params.next ?? '/area-clienti'} />
          <div>
            <label className='field-label' htmlFor='login-email'>Email</label>
            <input id='login-email' name='email' type='email' autoComplete='email' required className='field-input' />
          </div>
          <div>
            <label className='field-label' htmlFor='login-password'>Password</label>
            <PasswordField id='login-password' name='password' autoComplete='current-password' />
          </div>
          <button type='submit' className='btn-primary w-full'>Accedi</button>
          <p className='text-center text-xs text-muted'>
            <Link href='/password-dimenticata' className='underline hover:text-gold'>Password dimenticata?</Link>
          </p>
        </form>

        <p className='text-center text-sm text-muted'>
          Non hai un account? <Link href='/registrati' className='font-medium text-ink underline hover:text-gold'>Registrati</Link>
        </p>
      </div>
    </div>
  )
}
import type { Metadata } from 'next'
import { PasswordField } from '@/components/auth/password-field'

export const metadata: Metadata = {
  title: 'Nuova password',
  robots: { index: false },
}

type Search = Promise<{ errore?: string }>

export default async function ResetPasswordPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams

  return (
    <div className='container-site flex min-h-[70vh] items-center justify-center py-16'>
      <div className='w-full max-w-md space-y-6'>
        <div className='space-y-3 text-center'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl'>Scegli una nuova password.</h1>
        </div>

        {params.errore && (
          <p className='rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>
            {params.errore}
          </p>
        )}

        <form action='/api/account/imposta-password' method='post' className='card space-y-4'>
          <div>
            <label className='field-label' htmlFor='reset-password'>Nuova password</label>
            <PasswordField id='reset-password' name='password' />
            <p className='mt-1 text-xs text-muted'>Almeno 8 caratteri, con maiuscola, minuscola e numero.</p>
          </div>
          <div>
            <label className='field-label' htmlFor='reset-confirm'>Ripeti la password</label>
            <PasswordField id='reset-confirm' name='confirmPassword' />
          </div>
          <button type='submit' className='btn-primary w-full'>Salva la password</button>
        </form>

        <p className='text-center text-xs text-muted'>
          <a href='/password-dimenticata' className='underline hover:text-gold'>Richiedi un nuovo link</a>
        </p>
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from '@/components/auth/password-field'
import { registerSchema } from '@/lib/validation/schemas'

type Props = { serviceId?: string }

export function RegisterForm({ serviceId }: Props) {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState('')
  const [sending, setSending] = useState(false)

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setGeneral('')

    if (!privacy) {
      setErrors({ privacy: 'Devi accettare la privacy policy per creare un account' })
      return
    }

    const parsed = registerSchema.safeParse({ ...values, marketingConsent })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/account/registrati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, privacy }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setErrors(body.fields ?? {})
        setGeneral(body.error ?? 'Registrazione non riuscita.')
        return
      }
      window.location.href = body.data.redirectTo ?? '/area-clienti'
    } catch {
      setGeneral('Connessione non disponibile. Riprova.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='space-y-4' noValidate>
      {general && <p className='rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>{general}</p>}
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label className='field-label' htmlFor='reg-first'>Nome</label>
          <input id='reg-first' className='field-input' autoComplete='given-name' value={values.firstName} onChange={(event) => update('firstName', event.target.value)} required aria-invalid={Boolean(errors.firstName)} />
          {errors.firstName && <p className='mt-1 text-xs text-danger'>{errors.firstName}</p>}
        </div>
        <div>
          <label className='field-label' htmlFor='reg-last'>Cognome</label>
          <input id='reg-last' className='field-input' autoComplete='family-name' value={values.lastName} onChange={(event) => update('lastName', event.target.value)} required aria-invalid={Boolean(errors.lastName)} />
          {errors.lastName && <p className='mt-1 text-xs text-danger'>{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label className='field-label' htmlFor='reg-email'>Email</label>
        <input id='reg-email' type='email' className='field-input' autoComplete='email' value={values.email} onChange={(event) => update('email', event.target.value)} required aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className='mt-1 text-xs text-danger'>{errors.email}</p>}
      </div>
      <div>
        <label className='field-label' htmlFor='reg-phone'>Telefono (facoltativo)</label>
        <input id='reg-phone' className='field-input' autoComplete='tel' inputMode='tel' value={values.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />
        {errors.phone && <p className='mt-1 text-xs text-danger'>{errors.phone}</p>}
      </div>
      <div>
        <label className='field-label' htmlFor='reg-password'>Password</label>
        <PasswordField id='reg-password' name='password' value={values.password} onChange={(value) => update('password', value)} />
        {errors.password ? (
          <p className='mt-1 text-xs text-danger'>{errors.password}</p>
        ) : (
          <p className='mt-1 text-xs text-muted'>Almeno 8 caratteri, con maiuscola, minuscola e numero.</p>
        )}
      </div>

      <label className='flex items-start gap-3 text-xs text-muted'>
        <input type='checkbox' className='mt-0.5 h-4 w-4 accent-ink' checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
        <span>
          Ho letto e accetto la <Link href='/privacy' className='underline hover:text-gold'>privacy policy</Link>.
        </span>
      </label>
      {errors.privacy && <p className='text-xs text-danger'>{errors.privacy}</p>}

      <label className='flex items-start gap-3 text-xs text-muted'>
        <input type='checkbox' className='mt-0.5 h-4 w-4 accent-ink' checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
        <span>Voglio ricevere novita e offerte del salone (facoltativo).</span>
      </label>

      <button type='submit' className='btn-primary w-full' disabled={sending}>
        {sending ? 'Creo il tuo account...' : 'Crea account'}
      </button>
    </form>
  )
}
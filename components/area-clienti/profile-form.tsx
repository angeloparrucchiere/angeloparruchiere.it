'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'

type Props = {
  initial: { firstName: string; lastName: string; phone: string; marketingConsent: boolean }
  email: string
}

export function ProfileForm({ initial, email }: Props) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Props['initial']>(key: K, value: Props['initial'][K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/account/profilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setErrors(body.fields ?? {})
        setError(body.error ?? 'Salvataggio non riuscito.')
        return
      }
      setMessage('Profilo aggiornato.')
      router.refresh()
    } catch {
      setError('Connessione non disponibile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='card space-y-4'>
      {message && <p className='rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success' role='status'>{message}</p>}
      {error && <p className='rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>{error}</p>}

      <div>
        <p className='field-label'>Email (non modificabile)</p>
        <p className='rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted'>{email}</p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label className='field-label' htmlFor='p-first'>Nome</label>
          <input id='p-first' className='field-input' value={values.firstName} onChange={(event) => update('firstName', event.target.value)} required />
          {errors.firstName && <p className='mt-1 text-xs text-danger'>{errors.firstName}</p>}
        </div>
        <div>
          <label className='field-label' htmlFor='p-last'>Cognome</label>
          <input id='p-last' className='field-input' value={values.lastName} onChange={(event) => update('lastName', event.target.value)} required />
          {errors.lastName && <p className='mt-1 text-xs text-danger'>{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label className='field-label' htmlFor='p-phone'>Telefono</label>
        <input id='p-phone' className='field-input' inputMode='tel' value={values.phone} onChange={(event) => update('phone', event.target.value)} />
        {errors.phone && <p className='mt-1 text-xs text-danger'>{errors.phone}</p>}
      </div>
      <label className='flex items-start gap-3 text-xs text-muted'>
        <input
          type='checkbox'
          className='mt-0.5 h-4 w-4 accent-ink'
          checked={values.marketingConsent}
          onChange={(event) => update('marketingConsent', event.target.checked)}
        />
        <span>Ricevi novita e offerte del salone. Puoi revocare quando vuoi.</span>
      </label>
      <button type='submit' className='btn-primary' disabled={saving}>
        {saving ? 'Salvo...' : 'Salva'}
      </button>
    </form>
  )
}
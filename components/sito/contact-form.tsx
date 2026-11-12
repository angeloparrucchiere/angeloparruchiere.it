'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'

type Fields = { name: string; email: string; phone: string; message: string }

const empty: Fields = { name: '', email: '', phone: '', message: '' }

export function ContactForm() {
  const [fields, setFields] = useState<Fields>(empty)
  const [privacy, setPrivacy] = useState(false)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  function update(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setErrors({})
    setGeneral('')

    try {
      const response = await fetch('/api/sito/contatti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, privacyConsent: privacy, website }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setErrors(body.fields ?? {})
        setGeneral(body.error ?? 'Qualcosa non ha funzionato.')
        return
      }
      setDone(true)
      setFields(empty)
      setPrivacy(false)
    } catch {
      setGeneral('Connessione non disponibile. Riprova tra poco.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className='card space-y-2' role='status'>
        <p className='font-display text-2xl'>Messaggio inviato</p>
        <p className='text-sm text-muted'>Grazie, ti rispondiamo il prima possibile.</p>
        <button type='button' className='btn-ghost mt-2' onClick={() => setDone(false)}>
          Scrivi un altro messaggio
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className='card space-y-4' noValidate>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label className='field-label' htmlFor='contact-name'>Nome e cognome</label>
          <input
            id='contact-name'
            className='field-input'
            value={fields.name}
            onChange={(event) => update('name', event.target.value)}
            autoComplete='name'
            required
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className='mt-1 text-xs text-danger'>{errors.name}</p>}
        </div>
        <div>
          <label className='field-label' htmlFor='contact-email'>Email</label>
          <input
            id='contact-email'
            type='email'
            className='field-input'
            value={fields.email}
            onChange={(event) => update('email', event.target.value)}
            autoComplete='email'
            required
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className='mt-1 text-xs text-danger'>{errors.email}</p>}
        </div>
      </div>
      <div>
        <label className='field-label' htmlFor='contact-phone'>Telefono (facoltativo)</label>
        <input
          id='contact-phone'
          className='field-input'
          value={fields.phone}
          onChange={(event) => update('phone', event.target.value)}
          autoComplete='tel'
          inputMode='tel'
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <p className='mt-1 text-xs text-danger'>{errors.phone}</p>}
      </div>
      <div>
        <label className='field-label' htmlFor='contact-message'>Messaggio</label>
        <textarea
          id='contact-message'
          className='field-textarea min-h-36'
          value={fields.message}
          onChange={(event) => update('message', event.target.value)}
          required
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <p className='mt-1 text-xs text-danger'>{errors.message}</p>}
      </div>
      <div className='absolute -left-[9999px]' aria-hidden='true'>
        <label htmlFor='contact-website'>Sito web</label>
        <input id='contact-website' tabIndex={-1} autoComplete='off' value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <label className='flex items-start gap-3 text-xs text-muted'>
        <input
          type='checkbox'
          className='mt-0.5 h-4 w-4 accent-ink'
          checked={privacy}
          onChange={(event) => setPrivacy(event.target.checked)}
        />
        <span>
          Ho letto la{' '}
          <Link href='/privacy' className='underline hover:text-gold'>privacy policy</Link> e acconsento al
          trattamento dei dati per ricevere una risposta.
        </span>
      </label>
      {errors.privacyConsent && <p className='text-xs text-danger'>{errors.privacyConsent}</p>}
      {general && <p className='text-sm text-danger' role='alert'>{general}</p>}
      <button type='submit' className='btn-primary' disabled={sending}>
        {sending ? 'Invio...' : 'Invia messaggio'}
      </button>
    </form>
  )
}
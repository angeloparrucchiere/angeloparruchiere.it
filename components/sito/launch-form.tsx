'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

export function LaunchForm() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setMessage('')

    try {
      const response = await fetch('/api/sito/apertura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setState('error')
        setMessage(body.error ?? 'Qualcosa non ha funzionato. Riprova.')
        return
      }
      setState('done')
      setEmail('')
    } catch {
      setState('error')
      setMessage('Connessione non disponibile. Riprova tra poco.')
    }
  }

  if (state === 'done') {
    return (
      <div className='rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm' role='status'>
        <p className='font-semibold'>Sei in lista.</p>
        <p className='mt-1 text-muted'>Ti scriviamo appena apriamo le prenotazioni.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className='space-y-3' noValidate>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <label className='sr-only' htmlFor='launch-email'>Indirizzo email</label>
        <input
          id='launch-email'
          type='email'
          required
          autoComplete='email'
          placeholder='la tua@email.it'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className='field-input'
        />
        <button type='submit' className='btn-primary shrink-0' disabled={state === 'sending'}>
          {state === 'sending' ? 'Invio...' : 'Avvisami'}
        </button>
      </div>
      <div className='absolute -left-[9999px]' aria-hidden='true'>
        <label htmlFor='launch-website'>Sito web</label>
        <input
          id='launch-website'
          tabIndex={-1}
          autoComplete='off'
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {message && (
        <p className='text-sm text-danger' role='alert'>
          {message}
        </p>
      )}
      <p className='text-xs text-muted'>
        Usiamo la tua email solo per avvisarti dell&apos;apertura. Nessuna newsletter.
      </p>
    </form>
  )
}
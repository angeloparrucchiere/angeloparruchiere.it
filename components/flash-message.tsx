'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const MESSAGES: Record<string, string> = {
  misconfigured:
    'Supabase non e configurato. Aggiungi NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local e riavvia il server.',
  unauthenticated: 'Sessione scaduta o non valida. Accedi di nuovo.',
  forbidden: 'Non hai i permessi per questa sezione.',
  'not-found': 'Elemento non trovato.',
  'not-staff': 'Questo account non ha accesso allo staff.',
  generic: 'Qualcosa non ha funzionato. Riprova tra poco.',
}

export function ErrorBanner({ code, fallback }: { code?: string; fallback?: string }) {
  const [message, setMessage] = useState(fallback ?? '')

  useEffect(() => {
    if (code && MESSAGES[code]) setMessage(MESSAGES[code])
  }, [code])

  if (!message) return null
  return (
    <p className='mb-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>
      {message}
    </p>
  )
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('NEXT_PUBLIC_SUPABASE_URL') || message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    return MESSAGES.misconfigured
  }
  if (message === 'UNAUTHENTICATED') return MESSAGES.unauthenticated
  if (message === 'FORBIDDEN') return MESSAGES.forbidden
  return MESSAGES.generic
}

export type Flash = { type: 'success' | 'error'; text: string; children?: ReactNode }

export function FlashMessage({ type, children }: { type: 'success' | 'error'; children: ReactNode }) {
  const classes =
    type === 'success'
      ? 'border-success/30 bg-success/5 text-success'
      : 'border-danger/30 bg-danger/5 text-danger'
  return (
    <p className={`mb-6 rounded-lg border px-4 py-3 text-sm ${classes}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
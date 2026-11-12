import 'server-only'
import { NextResponse } from 'next/server'

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json({ ok: false, error: 'Devi accedere per continuare.' }, { status: 401 })
  }
  if (message === 'FORBIDDEN') {
    return NextResponse.json({ ok: false, error: 'Non hai i permessi per questa operazione.' }, { status: 403 })
  }
  return null
}

export function safeHandler<T>(handler: () => Promise<T>) {
  return handler
}
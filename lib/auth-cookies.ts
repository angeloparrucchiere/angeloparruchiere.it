import 'server-only'
import { NextResponse } from 'next/server'
import type { Session } from '@supabase/supabase-js'

const CHUNK_SIZE = 3180
const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
  : 'sb'

function chunkName(key: string, index: number): string {
  return `${key}.${String.fromCharCode(97 + index)}`
}

export function splitCookieValue(key: string, value: string): Array<[string, string]> {
  if (value.length <= CHUNK_SIZE) return [[key, value]]
  const count = Math.ceil(value.length / CHUNK_SIZE)
  return Array.from({ length: count }, (_, index) => [
    chunkName(key, index),
    value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  ])
}

function base64url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Scrive i cookie nel formato atteso da @supabase/ssr (base64url, diviso in
 * chunk da 3180 caratteri). Cosi il login da form funziona anche senza JS.
 */
export function setAuthCookies(response: NextResponse, session: Session) {
  const key = `sb-${PROJECT_REF}-auth-token`
  const encoded =
    'base64-' +
    base64url(
      JSON.stringify({
        access_token: session.access_token,
        token_type: session.token_type,
        expires_in: session.expires_in,
        expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
        refresh_token: session.refresh_token,
        user: session.user,
      }),
    )

  const secure = process.env.NODE_ENV === 'production'

  for (const [name, value] of splitCookieValue(key, encoded)) {
    response.cookies.set(name, value, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure,
      maxAge: session.expires_in,
    })
  }
}

function cookieKeyFromRequest(request: Request): string {
  const cookie = request.headers.get('cookie') ?? ''
  for (const part of cookie.split(';')) {
    const [rawName, rawValue] = part.trim().split('=')
    if (rawName?.startsWith(`sb-${PROJECT_REF}-auth-token`)) {
      const payload = rawValue?.startsWith('base64-') ? atob(rawValue.slice(7).replace(/-/g, '+').replace(/_/g, '/')) : ''
      try {
        const parsed = JSON.parse(payload) as { access_token?: string }
        if (parsed.access_token) {
          return `sb-${parsed.access_token.split('.')[0]?.slice(0, 8)}-auth-token`
        }
      } catch {
        // valore non decodificabile: cade sul nome standard
      }
    }
  }
  return ''
}

/** Rimuove tutti i cookie di autenticazione presenti nella richiesta. */
export function clearAuthCookies(response: NextResponse, request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  const names = cookie
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter((name) => name?.startsWith('sb-') && name.includes('-auth-token'))

  for (const name of names) {
    if (!name) continue
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }

  const derived = cookieKeyFromRequest(request)
  if (derived) response.cookies.set(derived, '', { path: '/', maxAge: 0 })
  void CHUNK_SIZE
}
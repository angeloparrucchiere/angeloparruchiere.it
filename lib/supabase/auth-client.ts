import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Supabase non configurato: mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return { url, anonKey }
}

/** Client anon legato ai cookie della richiesta: per signUp, signIn e reset password. */
export async function createAuthClient() {
  const { url, anonKey } = config()
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

/** Client anon senza sessioni: per verificare credenziali o leggere utenti. */
export function createStatelessClient() {
  const { url, anonKey } = config()
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
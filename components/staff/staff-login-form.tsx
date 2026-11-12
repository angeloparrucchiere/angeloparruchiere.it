'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { STAFF_COOKIE, STAFF_COOKIE_MAX_AGE } from '@/lib/staff-access'
import { PasswordField } from '@/components/auth/password-field'
import { createBrowserSupabase } from '@/lib/supabase/browser'

export function StaffLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        document.cookie = `${STAFF_COOKIE}=1; path=/; max-age=${STAFF_COOKIE_MAX_AGE}; samesite=lax`
        router.replace('/staff/prenotazioni')
      }
    })
  }, [router])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      const supabase = createBrowserSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.session) {
        setError('Email o password non corretti.')
        return
      }
      const role = (data.user?.app_metadata?.role as string | undefined) ?? 'cliente'
      if (role !== 'staff' && role !== 'admin') {
        await supabase.auth.signOut()
        setError('Questo account non e abilitato allo staff.')
        return
      }
      document.cookie = `${STAFF_COOKIE}=1; path=/; max-age=${STAFF_COOKIE_MAX_AGE}; samesite=lax`
      router.replace('/staff/prenotazioni')
      router.refresh()
    } catch {
      setError('Connessione non disponibile. Riprova.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className='card space-y-4'>
      {error && <p className='rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger' role='alert'>{error}</p>}
      <div>
        <label className='field-label' htmlFor='staff-email'>Email staff</label>
        <input id='staff-email' type='email' autoComplete='username' required className='field-input' value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <label className='field-label' htmlFor='staff-password'>Password</label>
        <PasswordField id='staff-password' name='password' autoComplete='current-password' value={password} onChange={setPassword} />
      </div>
      <button type='submit' className='btn-primary w-full' disabled={sending}>
        {sending ? 'Accesso...' : 'Entra nel pannello'}
      </button>
    </form>
  )
}
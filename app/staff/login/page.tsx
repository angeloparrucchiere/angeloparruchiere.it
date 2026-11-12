import type { Metadata } from 'next'
import Link from 'next/link'
import { StaffLoginForm } from '@/components/staff/staff-login-form'

export const metadata: Metadata = {
  title: 'Accesso staff',
  robots: { index: false },
}

export default function StaffLoginPage() {
  return (
    <div className='container-site flex min-h-[70vh] items-center justify-center py-16'>
      <div className='w-full max-w-md space-y-6'>
        <div className='space-y-3 text-center'>
          <p className='eyebrow'>Pannello staff</p>
          <h1 className='text-4xl'>Solo per lo staff.</h1>
          <p className='text-sm text-muted'>Gestisci appuntamenti, disponibilita e attivita del salone.</p>
        </div>
        <StaffLoginForm />
        <p className='text-center text-xs text-muted'>
          Sei un cliente? <Link href='/accedi' className='underline hover:text-gold'>Vai all&apos;area clienti</Link>
        </p>
      </div>
    </div>
  )
}
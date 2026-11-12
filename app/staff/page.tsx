import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Accesso staff', robots: { index: false } }

export default function StaffIndexPage() {
  return (
    <div className='container-site flex min-h-[60vh] items-center justify-center py-16'>
      <div className='space-y-4 text-center'>
        <p className='font-display text-2xl tracking-[0.16em]'>ANGELO.</p>
        <p className='text-sm text-paper/70'>Il pannello staff si apre dal login.</p>
        <Link href='/staff/login' className='btn-primary inline-flex !bg-gold-soft !text-ink'>Accedi</Link>
      </div>
    </div>
  )
}
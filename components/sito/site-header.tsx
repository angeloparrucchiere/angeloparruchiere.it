'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/sito/logo'

const links = [
  { href: '/', label: 'Home' },
  { href: '/servizi', label: 'Servizi' },
  { href: '/apertura', label: 'Apertura' },
  { href: '/contatti', label: 'Contatti' },
]

type Props = { isLoggedIn: boolean; isStaff: boolean }

export function SiteHeader({ isLoggedIn, isStaff }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className='sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur'>
      <div className='container-site flex h-16 items-center justify-between gap-4'>
        <Logo />

        <nav className='hidden items-center gap-7 md:flex' aria-label='Navigazione principale'>
          {links
            .filter((link) => link.href !== '/apertura')
            .map((link) => (
              <Link key={link.href} href={link.href} className='nav-link'>
                {link.label}
              </Link>
            ))}
          {isLoggedIn ? (
            <Link href='/area-clienti' className='nav-link text-gold'>
              Area clienti
            </Link>
          ) : (
            <Link href='/accedi' className='nav-link'>
              Accedi
            </Link>
          )}
          {isStaff ? (
            <Link href='/staff/prenotazioni' className='btn-primary !px-5 !py-2'>
              Staff
            </Link>
          ) : (
            <Link href='/prenota' className='btn-primary !px-5 !py-2'>
              Prenota
            </Link>
          )}
        </nav>

        <button
          type='button'
          className='flex h-10 w-10 items-center justify-center rounded-full border border-line md:hidden'
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls='menu-mobile'
          aria-label={open ? 'Chiudi menu' : 'Apri menu'}
        >
          <span className='relative block h-3 w-5'>
            <span
              className={`absolute left-0 top-0 block h-px w-5 bg-ink transition-transform ${
                open ? 'translate-y-1.5 rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 block h-px w-5 bg-ink transition-transform ${
                open ? '-translate-y-1.5 -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav id='menu-mobile' className='border-t border-line bg-paper md:hidden' aria-label='Menu mobile'>
          <div className='container-site flex flex-col gap-1 py-3'>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='rounded-md px-2 py-3 text-sm uppercase tracking-[0.12em]'
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <Link href='/area-clienti' className='rounded-md px-2 py-3 text-sm uppercase tracking-[0.12em] text-gold'>
                Area clienti
              </Link>
            ) : (
              <Link href='/accedi' className='rounded-md px-2 py-3 text-sm uppercase tracking-[0.12em]'>
                Accedi
              </Link>
            )}
            {isStaff && (
              <Link href='/staff/prenotazioni' className='rounded-md px-2 py-3 text-sm uppercase tracking-[0.12em]'>
                Staff
              </Link>
            )}
            <Link href='/prenota' className='btn-primary mt-3'>
              Prenota
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
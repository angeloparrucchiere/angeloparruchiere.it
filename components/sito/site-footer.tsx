import Link from 'next/link'
import { SALON } from '@/lib/site'
import { Logo } from '@/components/sito/logo'

export function SiteFooter() {
  return (
    <footer className='mt-24 border-t border-line bg-paper'>
      <div className='container-site grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]'>
        <div className='space-y-4'>
          <Logo />
          <p className='max-w-sm text-sm leading-relaxed text-muted'>
            Salone di parrucchiere per uomo e donna. Taglio, colore, piega e trattamenti. Stiamo preparando
            l&apos;apertura: l&apos;area clienti e le prenotazioni online sono gia in costruzione.
          </p>
        </div>

        <div className='space-y-3 text-sm'>
          <p className='eyebrow'>Sito</p>
          <ul className='space-y-2'>
            <li><Link href='/servizi' className='hover:text-gold'>Servizi</Link></li>
            <li><Link href='/apertura' className='hover:text-gold'>Apertura</Link></li>
            <li><Link href='/contatti' className='hover:text-gold'>Contatti</Link></li>
            <li><Link href='/prenota' className='hover:text-gold'>Prenota</Link></li>
          </ul>
        </div>

        <div className='space-y-3 text-sm'>
          <p className='eyebrow'>Informazioni</p>
          <ul className='space-y-2 text-muted'>
            <li>{SALON.address.street}, {SALON.address.city}</li>
            {SALON.phone ? <li><a href={`tel:${SALON.phone}`} className='hover:text-gold'>{SALON.phone}</a></li> : null}
            <li><a href={`mailto:${SALON.email}`} className='hover:text-gold'>{SALON.email}</a></li>
            <li><Link href='/privacy' className='hover:text-gold'>Privacy policy</Link></li>
            <li><Link href='/cookie' className='hover:text-gold'>Cookie policy</Link></li>
            <li><Link href='/staff/login' className='hover:text-gold'>Area staff</Link></li>
          </ul>
        </div>
      </div>
      <div className='border-t border-line'>
        <div className='container-site flex flex-col gap-2 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between'>
          <p>© {new Date().getFullYear()} {SALON.name}. Tutti i diritti riservati.</p>
          <p>Apertura in arrivo. Contenuti in fase di preparazione.</p>
        </div>
      </div>
    </footer>
  )
}
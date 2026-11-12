import type { Metadata } from 'next'
import { LaunchForm } from '@/components/sito/launch-form'
import { WORKSHOP_INFO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Apertura del salone',
  description: 'Il salone sta prendendo forma. Lascia la tua email per essere tra i primi a prenotare.',
}

export default function AperturaPage() {
  return (
    <div className='container-site py-16'>
      <div className='grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center'>
        <div className='space-y-5'>
          <p className='eyebrow'>{WORKSHOP_INFO.label}</p>
          <h1 className='text-5xl sm:text-6xl'>{WORKSHOP_INFO.title}</h1>
          <p className='max-w-md text-sm leading-relaxed text-muted'>{WORKSHOP_INFO.body}</p>
          <ul className='space-y-3 text-sm'>
            <li className='flex gap-3'><span className='text-gold'>01</span>Area clienti con prenotazioni online.</li>
            <li className='flex gap-3'><span className='text-gold'>02</span>Conferme e promemoria via email.</li>
            <li className='flex gap-3'><span className='text-gold'>03</span>Staff e parrucchieri scrivono solo con dati di test.</li>
          </ul>
        </div>
        <div className='card space-y-5'>
          <div className='space-y-2'>
            <h2 className='text-2xl'>Entra nella lista d&apos;attesa</h2>
            <p className='text-sm text-muted'>Una sola email, quando il salone apre.</p>
          </div>
          <LaunchForm />
        </div>
      </div>
    </div>
  )
}
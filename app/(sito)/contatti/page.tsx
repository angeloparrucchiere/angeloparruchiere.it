import type { Metadata } from 'next'
import { ContactForm } from '@/components/sito/contact-form'
import { SALON } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contatti',
  description: 'Scrivici per informazioni, disponibilita e consigli. Ti rispondiamo via email.',
}

export default function ContattiPage() {
  return (
    <div className='container-site py-16'>
      <div className='grid gap-10 md:grid-cols-[1fr_1.1fr]'>
        <div className='space-y-6'>
          <p className='eyebrow'>Contatti</p>
          <h1 className='text-5xl'>Parliamone.</h1>
          <p className='max-w-md text-sm leading-relaxed text-muted'>
            Hai una domanda su un trattamento, un colore o un orario? Scrivici: rispondiamo per email,
            di norma entro un giorno lavorativo.
          </p>
          <div className='space-y-3 text-sm'>
            <p><span className='text-muted'>Email:</span> <a className='hover:text-gold' href={`mailto:${SALON.email}`}>{SALON.email}</a></p>
            {SALON.phone ? (
              <p><span className='text-muted'>Telefono:</span> <a className='hover:text-gold' href={`tel:${SALON.phone}`}>{SALON.phone}</a></p>
            ) : null}
            <p><span className='text-muted'>Indirizzo:</span> {SALON.address.street}, {SALON.address.city}</p>
          </div>
          <div className='card space-y-2'>
            <p className='eyebrow'>Orari</p>
            <ul className='space-y-1 text-sm text-muted'>
              {SALON.hours.map((item) => (
                <li key={item.days} className='flex justify-between gap-4'>
                  <span>{item.days}</span>
                  <span>{item.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  )
}
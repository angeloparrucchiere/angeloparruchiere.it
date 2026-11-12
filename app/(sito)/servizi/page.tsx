import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveServices } from '@/lib/db/catalog'
import { formatMinutes, formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Servizi e listino',
  description: 'Listino dei servizi del salone: taglio, barba, colore, piega e trattamenti.',
}

const CATEGORY_ORDER = ['taglio', 'barba', 'colore', 'trattamento']
const CATEGORY_LABEL: Record<string, string> = {
  taglio: 'Taglio',
  barba: 'Barba',
  colore: 'Colore',
  trattamento: 'Trattamenti',
}

export default async function ServiziPage() {
  const services = await getActiveServices().catch(() => [])
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category] ?? category,
    items: services.filter((service) => service.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <div className='container-site py-16'>
      <div className='max-w-2xl space-y-4'>
        <p className='eyebrow'>Servizi</p>
        <h1 className='text-5xl sm:text-6xl'>Il listino del salone.</h1>
        <p className='text-sm leading-relaxed text-muted'>
          Durata e prezzo indicati sono quelli che vedi al momento della prenotazione. I prezzi possono
          variare in base alla lunghezza e allo stato del capello: te lo confermiamo prima di iniziare.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className='card mt-12 max-w-xl space-y-3'>
          <p className='font-display text-2xl'>Il listino arriva presto.</p>
          <p className='text-sm text-muted'>
            Il salone non ha ancora pubblicato i servizi. Torni tra poco oppure scrivici per maggiori
            informazioni.
          </p>
          <Link href='/contatti' className='btn-secondary'>
            Contattaci
          </Link>
        </div>
      ) : (
        <div className='mt-12 space-y-14'>
          {groups.map((group) => (
            <section key={group.category} id={group.category} className='scroll-mt-24'>
              <div className='flex items-baseline justify-between gap-4 border-b border-line pb-3'>
                <h2 className='text-3xl'>{group.label}</h2>
                <span className='text-xs uppercase tracking-[0.18em] text-muted'>
                  {group.items.length} {group.items.length === 1 ? 'servizio' : 'servizi'}
                </span>
              </div>
              <ul className='divide-y divide-line'>
                {group.items.map((service) => (
                  <li key={service.id} className='grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline'>
                    <div className='space-y-1'>
                      <p className='text-lg font-medium'>{service.name}</p>
                      <p className='max-w-xl text-sm text-muted'>{service.description}</p>
                    </div>
                    <div className='flex items-baseline gap-6 sm:justify-end'>
                      <span className='text-xs uppercase tracking-[0.14em] text-muted'>
                        {formatMinutes(service.duration_minutes)}
                      </span>
                      <span className='font-display text-xl'>{formatPrice(service.price_cents)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className='mt-16 flex flex-wrap gap-3'>
        <Link href='/prenota' className='btn-primary'>Prenota un servizio</Link>
        <Link href='/contatti' className='btn-secondary'>Chiedi un consiglio</Link>
      </div>
    </div>
  )
}
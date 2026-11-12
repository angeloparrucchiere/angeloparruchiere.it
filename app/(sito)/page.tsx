import Link from 'next/link'
import { HOME, SALON, WORKSHOP_INFO } from '@/lib/site'
import { LaunchForm } from '@/components/sito/launch-form'

export default function HomePage() {
  return (
    <>
      <section className='relative overflow-hidden bg-ink text-paper'>
        <div className='container-site grid gap-12 py-20 md:grid-cols-[1.15fr_0.85fr] md:items-end md:py-28'>
          <div className='space-y-7'>
            <p className='eyebrow !text-gold-soft'>{HOME.hero.eyebrow}</p>
            <h1 className='max-w-xl text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl'>
              {HOME.hero.title}
            </h1>
            <p className='max-w-lg text-base leading-relaxed text-paper/70'>{HOME.hero.subtitle}</p>
            <div className='flex flex-wrap gap-3'>
              <Link href='/prenota' className='btn-primary !bg-gold-soft !text-ink hover:!bg-white'>
                Prenota online
              </Link>
              <Link
                href='/servizi'
                className='btn-secondary border-paper/40 !text-paper hover:!bg-paper hover:!text-ink'
              >
                Scopri i servizi
              </Link>
            </div>
          </div>

          <div className='relative hidden aspect-[4/5] w-full overflow-hidden rounded-t-full border border-paper/15 bg-gradient-to-b from-[#2a2620] via-[#171512] to-[#0b0b0b] md:block'>
            <div className='absolute inset-x-0 top-16 text-center'>
              <p className='font-display text-[7rem] leading-none text-gold/80'>A</p>
            </div>
            <div className='absolute inset-x-8 bottom-10 space-y-2 text-center'>
              <p className='text-xs uppercase tracking-[0.3em] text-paper/50'>Estetica</p>
              <p className='text-xs uppercase tracking-[0.3em] text-paper/50'>Precisione</p>
              <p className='text-xs uppercase tracking-[0.3em] text-paper/50'>Cura</p>
            </div>
          </div>
        </div>
      </section>

      <section className='border-b border-line'>
        <div className='container-site grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4'>
          <div>
            <p className='font-display text-3xl'>{HOME.services.length + 1}</p>
            <p className='text-xs uppercase tracking-[0.18em] text-muted'>Aree</p>
          </div>
          <div>
            <p className='font-display text-3xl'>2</p>
            <p className='text-xs uppercase tracking-[0.18em] text-muted'>Parrucchieri</p>
          </div>
          <div>
            <p className='font-display text-3xl'>Lun - Sab</p>
            <p className='text-xs uppercase tracking-[0.18em] text-muted'>Aperti</p>
          </div>
          <div>
            <p className='font-display text-3xl'>Online</p>
            <p className='text-xs uppercase tracking-[0.18em] text-muted'>Prenotazioni</p>
          </div>
        </div>
      </section>

      <section className='container-site py-20' id='servizi'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-3'>
            <p className='eyebrow'>Servizi</p>
            <h2 className='text-4xl sm:text-5xl'>Tutto quello che ti serve, in un solo posto.</h2>
          </div>
          <Link href='/servizi' className='nav-link self-start md:self-auto'>
            Listino completo
          </Link>
        </div>

        <div className='mt-10 grid gap-5 md:grid-cols-3'>
          {HOME.services.map((service, index) => (
            <Link
              key={service.title}
              href={service.href}
              className='card group flex flex-col justify-between gap-8 transition hover:border-gold'
            >
              <div className='space-y-3'>
                <p className='text-xs uppercase tracking-[0.22em] text-gold'>0{index + 1}</p>
                <h3 className='text-2xl'>{service.title}</h3>
                <p className='text-sm leading-relaxed text-muted'>{service.text}</p>
              </div>
              <span className='text-xs uppercase tracking-[0.18em] text-muted group-hover:text-gold'>
                Scopri &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className='bg-white'>
        <div className='container-site grid gap-10 py-20 md:grid-cols-3'>
          {HOME.steps.map((step, index) => (
            <div key={step.title} className='space-y-3'>
              <p className='font-display text-4xl text-gold'>{index + 1}</p>
              <h3 className='text-xl'>{step.title}</h3>
              <p className='text-sm leading-relaxed text-muted'>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id='apertura' className='border-y border-line bg-paper'>
        <div className='container-site grid gap-10 py-20 md:grid-cols-[1fr_1fr] md:items-center'>
          <div className='space-y-4'>
            <p className='eyebrow'>{WORKSHOP_INFO.label}</p>
            <h2 className='text-4xl sm:text-5xl'>{WORKSHOP_INFO.title}</h2>
            <p className='max-w-md text-sm leading-relaxed text-muted'>{WORKSHOP_INFO.body}</p>
          </div>
          <div className='space-y-4'>
            <LaunchForm />
            <div className='grid grid-cols-2 gap-3 text-xs text-muted'>
              {SALON.hours.slice(0, 4).map((item) => (
                <p key={item.days}>{item.days}: {item.hours}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
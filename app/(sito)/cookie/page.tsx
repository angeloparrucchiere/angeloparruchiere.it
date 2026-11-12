import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie policy',
  description: 'Quali cookie usa il sito e come gestirli.',
}

export default function CookiePage() {
  return (
    <div className='container-site py-16'>
      <article className='prose-site max-w-3xl space-y-6 text-sm leading-relaxed'>
        <div className='space-y-3'>
          <p className='eyebrow'>Informazioni legali</p>
          <h1 className='text-5xl'>Cookie policy</h1>
          <p className='text-muted'>
            Versione provvisoria della Fase 1. Aggiorneremo questa pagina quando attiveremo il banner e i
            servizi di terze parti.
          </p>
        </div>

        <h2>Cookie tecnici</h2>
        <p>
          Per far funzionare l&apos;accesso all&apos;area clienti e allo staff usiamo cookie tecnici, necessari
          e non profilanti. Non richiedono consenso.
        </p>

        <h2>Cookie di terze parti</h2>
        <p>
          Al momento non usiamo cookie di analytics, marketing o profilazione. Se in futuro li introdurremo,
          chiederemo prima il consenso e aggiorneremo questa pagina.
        </p>

        <h2>Gestione dal browser</h2>
        <p>
          Puoi cancellare o bloccare i cookie dalle impostazioni del tuo browser. Bloccare i cookie tecnici
          puo impedire l&apos;accesso all&apos;area clienti.
        </p>

        <p className='text-muted'>
          Per informazioni sui dati personali vedi la <Link href='/privacy' className='underline'>privacy policy</Link>.
        </p>
      </article>
    </div>
  )
}
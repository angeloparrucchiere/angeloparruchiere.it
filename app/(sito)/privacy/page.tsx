import type { Metadata } from 'next'
import { SALON } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'Come il salone tratta i dati personali.',
}

export default function PrivacyPage() {
  return (
    <div className='container-site py-16'>
      <article className='prose-site max-w-3xl space-y-6 text-sm leading-relaxed'>
        <div className='space-y-3'>
          <p className='eyebrow'>Informazioni legali</p>
          <h1 className='text-5xl'>Privacy policy</h1>
          <p className='text-muted'>
            Versione provvisoria della Fase 1. I testi definitivi saranno pubblicati prima dell&apos;apertura.
          </p>
        </div>

        <h2>Chi tratta i dati</h2>
        <p>
          Il titolare del trattamento e {SALON.name}, salone di parrucchiere. Per qualsiasi richiesta puoi
          scrivere a {SALON.email}.
        </p>

        <h2>Quali dati raccogliamo</h2>
        <ul>
          <li>Dati dell&apos;account: nome, cognome, email, telefono e password cifrata.</li>
          <li>Prenotazioni: servizio, parrucchiere, data, ora e note che scrivi.</li>
          <li>Contatti: nome, email, telefono e messaggio che ci invii.</li>
          <li>Lista d&apos;attesa: solo l&apos;indirizzo email.</li>
        </ul>

        <h2>Perche li trattiamo</h2>
        <p>
          Usiamo i dati per creare e gestire il tuo account, organizzare gli appuntamenti, inviare conferme e
          promemoria e rispondere alle tue richieste. Il trattamento e necessario all&apos;esecuzione del
          servizio o si basa sul tuo consenso quando lo chiediamo esplicitamente.
        </p>

        <h2>Dove stanno i dati</h2>
        <p>
          Database e autenticazione su Supabase, hosting su Vercel, email transazionali con Resend. I servizi
          scelti hanno sedi e fornitori nell&apos;Unione Europea o con garanzie adeguate.
        </p>

        <h2>Per quanto tempo</h2>
        <p>
          Conserviamo i dati dell&apos;account finche l&apos;account e attivo. Contatti archiviati vengono
          cancellati automaticamente dopo un anno. Le prenotazioni completate vengono mantenute nei limiti
          di legge per gli obblighi fiscali e contabili.
        </p>

        <h2>I tuoi diritti</h2>
        <p>
          Puoi chiedere accesso, rettifica o cancellazione dei tuoi dati scrivendo a {SALON.email}. Puoi anche
          revocare il consenso al marketing in qualsiasi momento dalla tua area clienti o scrivendoci.
        </p>

        <h2>Sicurezza</h2>
        <p>
          Gli accessi al database sono controllati e protetti da regole di isolamento. Le chiavi riservate non
          sono mai incluse nel sito pubblico.
        </p>
      </article>
    </div>
  )
}
# Angeloparruchiere

Infrastruttura tecnologica del salone di parrucchiere Angeloparruchiere.
Sito web, area clienti, email transazionali e (in seguito) prenotazioni online.

Stato: progetto in costruzione, salone non ancora aperto. Vedi AGENTS.md.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, auth, storage, row-level security)
- Resend (email transazionali)
- Vercel (hosting e deploy da GitHub)
- Netsons: dominio angeloparruchiere.it (registrar e DNS)
- Iubenda free (o alternativa free) per privacy, cookie policy e banner

## Servizi esterni

| Servizio | Uso | Piano attuale |
|---|---|---|
| Vercel | Hosting e deploy | Hobby (free) |
| Supabase | DB, auth, storage | Free |
| Resend | Email | Free |
| GitHub | Codice e CI | Free |
| Netsons | Dominio e DNS | dominio acquistato |
| Iubenda | Privacy e cookie | Free |

## Avvio locale (quando lo scaffold Next.js sara pronto)

1. Copia .env.example in .env.local e riempi i valori.
2. Installare le dipendenze con il gestore scelto (npm o pnpm).
3. Avviare il server di sviluppo su localhost.

Le istruzioni esatte dei comandi verranno aggiunte quando il progetto Next.js
viene inizializzato.

## Comandi

| Cosa | Comando |
|---|---|
| Git | gh |
| Deploy | vercel |
| Database | supabase |
| Email | resend (API/SDK) |

I comandi precisi si aggiungono man mano che lo scaffold prende forma.

## Documentazione

- AGENTS.md: regole e fasi per gli agenti di codice
- docs/prenotazioni.md: progetto del modulo prenotazioni

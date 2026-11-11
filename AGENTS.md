# AGENTS.md

Istruzioni per gli agenti di codice che lavorano su questo repository.

## Fase del progetto

QUESTO FILE È VIVO. La sezione "Stato" qui sotto dice in che fase siamo.
Quando sposti il progetto da una fase alla successiva, aggiorna questa sezione
e sposta i task di conseguenza. Non lasciare task chiusi tra quelli aperti.

Stato attuale: **FASE 1 - COSTRUZIONE** (il salone non è ancora aperto).
Al primo go-live ufficiale: cambia in **FASE 2 - MANUTENZIONE** e rileggi le
regole della fase 2 prima di toccare qualsiasi cosa.

### Fase 1 - Costruzione (adesso)

Obiettivo: portare online il sito, l'area clienti con autenticazione e le email
transazionali. Il salone è su carta: nessuna vendita reale, nessun cliente vero.

Regole in fase 1:
- Libertà di ristrutturare schema DB e componenti senza migrazioni compatibili.
- Vercel su piano Hobby, Supabase su piano Free. Nessun costo, nessun upgrade.
- Non inserire dati reali di clienti. Usa solo dati di test.
- Ogni funzionalità nuova deve avere il suo task qui sotto aggiornato.

### Fase 2 - Manutenzione (dopo il primo go-live ufficiale)

Trigger di passaggio: il salone apre e accetta il primo cliente reale.

Regole in fase 2:
- Vercel passa a Pro (uso commerciale). Supabase passa a Pro (no pausa).
- Ogni modifica allo schema DB richiede una migrazione versionata e testata.
- Nessuna modifica distruttiva ai dati senza backup verificato.
- Le email verso clienti reali vanno testate prima su un indirizzo interno.
- Privacy e cookie: aggiornare i testi se cambiano i servizi che trattano dati.

## Visione

Infrastruttura tecnologica di un salone di parrucchiere.
Si parte dal sito web e dalle funzioni base; prenotazioni e area clienti
crescono nella stessa piattaforma. Tutto in italiano per l'utente finale.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS per lo stile
- Supabase per database Postgres, autenticazione, storage e row-level security
- Resend per le email transazionali (conferme, reminder, recupero password)
- Vercel per hosting e deploy continui da GitHub
- GitHub per codice, pull request e automazioni (Actions)
- Netsons come registrar e provider DNS del dominio angeloparruchiere.it
- Iubenda (piano free) per privacy policy, cookie policy e cookie banner
- Iubenda cookie solution oppure alternativa gratuita (es. CookieYes free,
  Osano free) se Iubenda free non bastasse per il banner

Nessun backend separato: le API vivono nelle route di Next.js.

## Servizi esterni e costi

| Servizio | Piano attuale | Costo | Quando si paga |
|---|---|---|---|
| Vercel | Hobby | 0 | Al go-live reale -> Pro ~20$/mese |
| Supabase | Free | 0 | Al go-live reale -> Pro ~25$/mese |
| Resend | Free | 0 | Oltre 3.000 email/mese -> Pro 20$/mese |
| GitHub | Free | 0 | Mai, se resta pubblico/privato standard |
| Netsons | Dominio | già pagato | Rinnovo annuale |
| Iubenda | Free | 0 | Solo se servono moduli a pagamento |

Regola: non attivare piani a pagamento senza una decisione esplicita della persona.
In fase 1 tutto deve restare a costo zero.

## Dominio e DNS (Netsons + Vercel + Resend)

- Dominio: angeloparruchiere.it, registrato su Netsons.
- DNS: pannello Netsons -> Gestione Dominio -> DNS.
- Per collegare Vercel: seguire i record (A / CNAME) che Vercel mostra nel
  pannello del progetto, oppure delegare i nameserver a Vercel.
- Per le email Resend servono i record DNS forniti da Resend:
  SPF, DKIM e DMARC, aggiunti nella stessa zona DNS su Netsons.
- Non cambiare nameserver o record senza aver salvato una copia della zona attuale.

## Supabase: progetto Free tenuto sveglio

Il piano Free mette in pausa i progetti dopo 7 giorni di inattività.
Soluzione: un lavoro schedulato che tocca il progetto ogni pochi giorni.

- Workflow: .github/workflows/supabase-keepalive.yml
- Frequenza: 2 volte a settimana (molto sotto la soglia dei 7 giorni).
- Chiamata: una Edge Function o una route API che esegue una query reale
  (non un ping a vuoto). Preferisci lavoro utile: pulizia di slot scaduti,
  invio reminder, pulizia di sessioni vecchie.
- Segreti richiesti su GitHub: SUPABASE_URL e SUPABASE_ANON_KEY (o service key
  per operazioni di manutenzione). Mai committare chiavi nel repository.

Quando si passa a Supabase Pro, il keep-alive non serve più: disattivalo o
lascialo se continua a fare lavoro utile.

## Convenzioni di codice

- TypeScript ovunque, niente JavaScript sciolto.
- Componenti React con funzione, niente classi.
- Nomi file componenti in PascalCase, utility in kebab-case.
- Testi UI in italiano.
- Variabili e funzioni in inglese, commenti solo dove servono davvero.
- Validazione input con Zod.
- Date e fusi orari gestiti con una libreria dedicata (date-fns o luxon).
- Non aggiungere dipendenze senza motivo chiaro e senza aggiornare questo file.

## Database

- Migrazioni versionate in supabase/migrations.
- In fase 1 lo schema può cambiare liberamente.
- Row-level security attiva su ogni tabella con dati utente.
- Tabelle previste (progetto, non tutte implementate):
  profiles, services, staff, availability, appointments, contacts, emails_log.

## Prenotazioni

Progettate ora, costruite dopo il lancio del sito e dell'area clienti.
Schema e flusso: docs/prenotazioni.md.
Non implementare il modulo prenotazioni finché non è il suo turno nei task.

## Privacy, cookie e consenso

- Privacy policy, cookie policy e banner: Iubenda free (o alternativa free).
- Il banner va caricato prima di ogni script di tracciamento non necessario.
- Nessun cookie di analytics o marketing senza consenso.
- In fase 1 usare solo servizi gratuiti; nessun tracker a pagamento.

## Sicurezza

- Segreti solo in variabili d'ambiente, mai nel codice.
- Chiave service di Supabase solo lato server, mai nel client.
- Row-level security attiva prima di esporre dati di clienti.

## Task

Aggiorna questa lista man mano. Fase 1: costruzione. Fase 2: manutenzione.

### Fase 1 - Costruzione

- [ ] Definire struttura cartelle Next.js e pagine base del sito
- [ ] Configurare Supabase (progetto, auth, tabelle iniziali, RLS)
- [ ] Collegare il dominio angeloparruchiere.it a Vercel tramite DNS Netsons
- [ ] Configurare Resend (dominio, SPF, DKIM, DMARC) e prime email
- [ ] Integrare Iubenda free: privacy, cookie policy, banner
- [ ] Attivare il workflow keep-alive Supabase
- [ ] Costruire area clienti (registrazione, login, profilo)
- [ ] Costruire form contatti con invio email
- [ ] Implementare prenotazioni (dopo sito e area clienti)
- [ ] Verificare tutto su mobile e con dati di test

### Fase 2 - Manutenzione

- [ ] Passare Vercel e Supabase a piano Pro al go-live
- [ ] Disattivare o riconvertire il keep-alive Supabase
- [ ] Processo di migrazione DB versionata e testata
- [ ] Backup e ripristino verificati
- [ ] Revisione periodica privacy e cookie

## Cosa non fare

- Non attivare piani a pagamento in fase 1.
- Non inserire dati reali di clienti in fase 1.
- Non committare segreti o file .env.
- Non riscrivere l'architettura senza aggiornare questo file e i task.

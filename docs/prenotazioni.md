# Modulo prenotazioni - progetto

Progettato ora, costruito dopo il lancio di sito e area clienti.
In fase 1 non si implementa il codice, solo lo schema e il flusso.

## Obiettivo

Permettere a un cliente registrato di prenotare un servizio con un parrucchiere,
scegliendo data e ora tra gli slot disponibili, ricevendo conferma via email.

## Perche costruirlo in casa invece di un servizio esterno

- Servizi esterni come Cal.com costano per utente/staff (il salone ha piu parrucchieri).
- Le prenotazioni vivono nella stessa area clienti, con gli stessi dati.
- Il costo resta fisso (Supabase) invece di crescere con lo staff.
- Vedi il preventivo completo in AGENTS.md e nella conversazione di progetto.

## Tabelle previste

- services: i servizi offerti (nome, durata in minuti, prezzo).
- staff: i parrucchieri (profilo, servizi abilitati).
- availability: fasce di disponibilita per staff (giorno settimana, ora inizio, ora fine).
- appointments: prenotazioni (cliente, servizio, staff, inizio, fine, stato).
- profiles: dati del cliente collegati all'utente autenticato.

Stati di un appuntamento: richiesto, confermato, completato, annullato.

## Flusso

1. Il cliente sceglie il servizio.
2. Il sistema propone gli slot liberi in base a durata e disponibilita staff.
3. Il cliente conferma data e ora.
4. Nasce un appuntamento in stato richiesto.
5. Email di conferma al cliente via Resend.
6. Reminder automatico prima dell'appuntamento (via workflow schedulato).

## Regole tecniche

- Gli slot si calcolano al momento, sottraendo appuntamenti gia presi.
- Attenzione a fuso orario e ora legale: usare una libreria dedicata.
- Row-level security: un cliente vede solo i propri appuntamenti.
- Nessun doppio appuntamento sullo stesso staff e ora.

## Da decidere piu avanti

- Anticipo minimo per prenotare (es. 24 ore prima).
- Politica di annullamento.
- Acconto o pagamento online (in tal caso entra Stripe).



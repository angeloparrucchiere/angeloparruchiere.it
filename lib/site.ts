// Dati del salone e testi riusati in piu pagine.
// Fase 1: il salone non è ancora aperto, questi valori sono segnaposto
// finche la persona non li conferma.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://angeloparruchiere.it'

export const SALON = {
  name: 'Angeloparruchiere',
  tagline: 'Salone di parrucchiere',
  address: {
    street: 'Via da confermare',
    city: 'Roma',
    postalCode: '',
    province: 'RM',
    mapsUrl: '',
    confirmed: false,
  },
  phone: '',
  email: 'ciao@angeloparruchiere.it',
  instagram: '',
  whatsapp: '',
  hours: [
    { days: 'Lunedì e martedì', hours: '09:00 - 19:00' },
    { days: 'Mercoledì', hours: '09:00 - 19:00' },
    { days: 'Giovedì', hours: '09:00 - 19:00' },
    { days: 'Venerdì', hours: '09:00 - 19:00' },
    { days: 'Sabato', hours: '09:00 - 17:00' },
    { days: 'Domenica', hours: 'Chiuso' },
  ],
  timeZone: 'Europe/Rome',
} as const

export const WORKSHOP_INFO = {
  label: 'Apertura in arrivo',
  title: 'Il salone sta prendendo forma.',
  body:
    "Stiamo preparando i locali e l'area clienti. Lascia la tua email e ti avvisiamo quando apriamo le prenotazioni.",
} as const

export const HOME = {
  hero: {
    eyebrow: 'Salone di parrucchiere',
    title: 'Taglio, colore, cura..',
    subtitle:
      "Uno spazio curato per uomo e donna, dove ogni dettaglio conta: dal taglio alla piega, dal colore al trattamento. Stiamo aprendo il salone: qui trovi le anteprime.",
  },
  services: [
    {
      title: 'Taglio uomo e bambino',
      text: 'Taglio su misura con lavaggio e styling finale. Barba curata a forbice o macchinetta.',
      href: '/servizi#taglio',
    },
    {
      title: 'Colore e balayage',
      text: 'Colori naturali e schiariture luminose, pensate sul tuo incarnato e sul tuo stile.',
      href: '/servizi#colore',
    },
    {
      title: 'Piega e trattamenti',
      text: "Pieghe e trattamenti ristrutturanti per ritrovare luminosità e corpo.",
      href: '/servizi#trattamento',
    },
  ],
  steps: [
    { title: 'Scegli il servizio', text: 'Taglio, colore o trattamento: vedi durata e prezzo.' },
    { title: 'Prenota online', text: "Seleziona giornata e ora libera con il tuo parrucchiere." },
    { title: "Ricevi l'email", text: 'Conferma e reminder automatici, nessuna telefonata.' },
  ],
} as const
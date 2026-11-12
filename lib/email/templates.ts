import 'server-only'
import { formatDateTime, formatPrice } from '@/lib/format'
import { SALON, SITE_URL } from '@/lib/site'

export type EmailKind =
  | 'richiesta_ricevuta'
  | 'confermato'
  | 'annullato'
  | 'spostato'
  | 'promemoria'
  | 'contatto'
  | 'apertura'

export type EmailContent = { subject: string; html: string; text: string }

type AppointmentEmailData = {
  firstName: string
  serviceName: string
  priceCents: number
  staffName: string
  startsAt: string
}

const GOLD = '#c6a34a'
const INK = '#0b0b0b'

function layout(title: string, intro: string, rows: Array<[string, string]>, footer: string) {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#6b675f;font-size:13px;">${label}</td><td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${value}</td></tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="it">
  <body style="margin:0;padding:0;background:#f7f5f0;font-family:Helvetica,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:14px;padding:32px;border:1px solid #e2ddd2;">
          <tr><td style="font-size:15px;font-weight:700;letter-spacing:0.18em;">ANGELOPARRUCHIERE</td></tr>
          <tr><td style="height:22px;"></td></tr>
          <tr><td style="font-family:Georgia,serif;font-size:26px;line-height:1.2;">${title}</td></tr>
          <tr><td style="height:12px;"></td></tr>
          <tr><td style="font-size:15px;line-height:1.6;color:#333;">${intro}</td></tr>
          <tr><td style="height:20px;"></td></tr>
          <tr><td style="border-top:1px solid #eee;padding-top:12px;"><table role="presentation" width="100%">${rowsHtml}</table></td></tr>
          <tr><td style="height:18px;"></td></tr>
          <tr><td style="font-size:12px;line-height:1.6;color:#777;">${footer}</td></tr>
          <tr><td style="height:24px;"></td></tr>
          <tr><td><a href="${SITE_URL}/area-clienti" style="display:inline-block;background:${INK};color:${GOLD};text-decoration:none;padding:12px 22px;border-radius:999px;font-size:13px;font-weight:600;">Vai alla tua area</a></td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;"><tr><td style="padding:16px 8px;font-size:11px;color:#999;">${SALON.name} - angeloparruchiere.it</td></tr></table>
      </td></tr>
    </table>
  </body>
</html>`
}

function textVersion(title: string, intro: string, rows: Array<[string, string]>, footer: string) {
  return [
    'ANGELOPARRUCHIERE',
    '',
    title,
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    footer,
    '',
    `La tua area: ${SITE_URL}/area-clienti`,
  ].join('\n')
}

function appointmentRows(data: AppointmentEmailData): Array<[string, string]> {
  return [
    ['Servizio', data.serviceName],
    ['Parrucchiere', data.staffName],
    ['Quando', formatDateTime(data.startsAt)],
    ['Prezzo', formatPrice(data.priceCents)],
  ]
}

function build(title: string, intro: string, rows: Array<[string, string]>, footer: string): EmailContent {
  return { subject: title, html: layout(title, intro, rows, footer), text: textVersion(title, intro, rows, footer) }
}

export function requestReceivedEmail(data: AppointmentEmailData): EmailContent {
  return build(
    'Richiesta ricevuta',
    `Ciao ${data.firstName}, abbiamo ricevuto la tua richiesta. Ti confermiamo l'appuntamento appena il salone la valida.`,
    appointmentRows(data),
    'Puoi annullare la richiesta dalla tua area clienti.',
  )
}

export function appointmentConfirmedEmail(data: AppointmentEmailData): EmailContent {
  const content = build(
    'Appuntamento confermato',
    `Ciao ${data.firstName}, il tuo appuntamento e confermato. Ti aspettiamo.`,
    appointmentRows(data),
    'Se qualcosa cambia, puoi annullare o riprogrammare dalla tua area clienti.',
  )
  return {
    ...content,
    subject: `Confermato: ${data.serviceName} - ${formatDateTime(data.startsAt)}`,
  }
}

export function appointmentReminderEmail(data: AppointmentEmailData): EmailContent {
  return build(
    'Ci vediamo a breve',
    `Ciao ${data.firstName}, ti ricordiamo il tuo appuntamento.`,
    appointmentRows(data),
    'Se non puoi venire, annulla dalla tua area clienti cosi liberiamo il posto.',
  )
}

export function appointmentCancelledEmail(data: AppointmentEmailData, byStaff: boolean): EmailContent {
  return build(
    'Appuntamento annullato',
    byStaff
      ? `Ciao ${data.firstName}, il salone ha dovuto annullare il tuo appuntamento. Puoi sceglierne uno nuovo online.`
      : `Ciao ${data.firstName}, abbiamo annullato il tuo appuntamento.`,
    appointmentRows(data),
    byStaff
      ? 'Ci scusiamo per il disagio. Scegli un nuovo orario quando vuoi.'
      : 'Se e stato un errore, puoi prenotare di nuovo.',
  )
}

export function appointmentRescheduledEmail(data: AppointmentEmailData, byStaff: boolean): EmailContent {
  const content = build(
    'Appuntamento spostato',
    byStaff
      ? `Ciao ${data.firstName}, il salone ha spostato il tuo appuntamento al nuovo orario qui sotto.`
      : `Ciao ${data.firstName}, il tuo appuntamento e stato spostato.`,
    appointmentRows(data),
    'Se il nuovo orario non va bene, annulla dalla tua area o contattaci.',
  )
  return { ...content, subject: `Nuovo orario: ${formatDateTime(data.startsAt)}` }
}

export function contactReplyEmail(name: string, message: string): EmailContent {
  return {
    subject: 'Messaggio ricevuto',
    html: layout(
      'Grazie per averci scritto',
      `Ciao ${name}, abbiamo ricevuto il tuo messaggio e ti rispondiamo il prima possibile.`,
      [['Il tuo messaggio', message.slice(0, 400)]],
      'Se vuoi aggiungere qualcosa, rispondi pure a questa email.',
    ),
    text: textVersion(
      'Grazie per averci scritto',
      `Ciao ${name}, abbiamo ricevuto il tuo messaggio e ti rispondiamo il prima possibile.`,
      [['Il tuo messaggio', message.slice(0, 400)]],
      'Se vuoi aggiungere qualcosa, rispondi pure a questa email.',
    ),
  }
}

export function launchThanksEmail(): EmailContent {
  return build(
    'Ci siamo quasi',
    'Grazie! Ti scriveremo appena apriamo le prenotazioni.',
    [],
    'Nessuna newsletter, solo una email quando il salone apre.',
  )
}
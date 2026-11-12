import 'server-only'
import { Resend } from 'resend'

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

type SendArgs = {
  from: string
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY non configurata' }

  try {
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from: args.from,
      to: [process.env.NODE_ENV !== 'production' && process.env.RESEND_TEST_TO ? process.env.RESEND_TEST_TO : args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
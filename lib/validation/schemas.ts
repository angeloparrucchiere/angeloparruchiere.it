import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(3)
  .max(160)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Inserisci un indirizzo email valido')

const personName = z
  .string()
  .trim()
  .min(2, 'Il nome deve avere almeno 2 caratteri')
  .max(60, 'Il nome è troppo lungo')
  .regex(/^[\p{L}\p{M}'’ -]+$/u, 'Il nome contiene caratteri non validi')

const phone = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) => value === '' || /^[+]?[0-9\s().-]{7,20}$/.test(value),
    'Inserisci un numero di telefono valido',
  )

export const passwordSchema = z
  .string()
  .min(8, 'La password deve avere almeno 8 caratteri')
  .max(72, 'La password è troppo lunga')
  .regex(/[a-z]/, 'La password deve contenere una lettera minuscola')
  .regex(/[A-Z]/, 'La password deve contenere una lettera maiuscola')
  .regex(/[0-9]/, 'La password deve contenere un numero')

export const registerSchema = z.object({
  firstName: personName,
  lastName: personName,
  email,
  phone: phone.optional().default(''),
  password: passwordSchema,
  marketingConsent: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Inserisci la password'),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Le password non coincidono',
})

export const profileSchema = z.object({
  firstName: personName,
  lastName: personName,
  phone: phone.optional().default(''),
  marketingConsent: z.boolean().optional().default(false),
})

export const contactSchema = z.object({
  name: personName,
  email,
  phone: phone.optional().default(''),
  message: z
    .string()
    .trim()
    .min(10, 'Scrivi almeno 10 caratteri')
    .max(2000, 'Il messaggio è troppo lungo'),
  privacyConsent: z.literal(true, { error: 'Devi accettare la privacy policy' }),
  website: z.string().max(0).optional().default(''),
})

export const launchSignupSchema = z.object({
  email,
  website: z.string().max(0).optional().default(''),
})

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida')

export const bookRequestSchema = z.object({
  serviceId: z.uuid({ error: 'Servizio non valido' }),
  date: dateKeySchema,
  startMinutes: z.number().int().min(0).max(24 * 60 - 1),
  notes: z.string().trim().max(500, 'Le note sono troppo lunghe').optional().default(''),
})

export const staffAppointmentActionSchema = z.object({
  appointmentId: z.uuid(),
  action: z.enum(['conferma', 'completa', 'annulla', 'rifiuta']),
  staffNote: z.string().trim().max(500).optional().default(''),
})

export const availabilitySetSchema = z.object({
  staffId: z.uuid(),
  weekday: z.number().int().min(0).max(6),
  windows: z
    .array(
      z.object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(4),
})

export const rescheduleSchema = z.object({
  appointmentId: z.uuid(),
  date: dateKeySchema,
  startMinutes: z.number().int().min(0).max(24 * 60 - 1),
})

export const seedSchema = z.object({
  includeAccounts: z.boolean().optional().default(false),
})

export const linkStaffSchema = z.object({
  email,
  role: z.enum(['admin', 'staff']),
  displayName: z.string().trim().min(2).max(60),
  title: z.string().trim().max(60).optional().default('Parrucchiere'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type BookRequestInput = z.infer<typeof bookRequestSchema>

/** Primo errore leggibile da mostrare in un form. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Dati non validi'
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!result[key]) result[key] = issue.message
  }
  return result
}
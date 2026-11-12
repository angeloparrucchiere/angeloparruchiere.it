import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export { TIME_ZONE } from './time-zone'

const dateTimeFormat = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'Europe/Rome',
})

const dayFormat = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Rome',
})

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value))
}

export function formatDateLong(value: string | Date): string {
  return dayFormat.format(new Date(value))
}

export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(new Date(value))
}

export function formatShortDate(value: string | Date): string {
  return format(new Date(value), 'dd/MM/yyyy', { locale: it })
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} ${hours === 1 ? 'ora' : 'ore'}`
  return `${hours} h ${rest} min`
}

export const STATUS_LABEL: Record<string, string> = {
  richiesto: 'Richiesto',
  confermato: 'Confermato',
  completato: 'Completato',
  annullato: 'Annullato',
  rifiutato: 'Non confermato',
}

export const STATUS_CLASS: Record<string, string> = {
  richiesto: 'bg-amber-50 text-amber-800 border-amber-200',
  confermato: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completato: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  annullato: 'bg-red-50 text-red-800 border-red-200',
  rifiutato: 'bg-red-50 text-red-800 border-red-200',
}
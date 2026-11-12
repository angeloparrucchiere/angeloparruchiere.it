'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { formatMinutes, formatPrice } from '@/lib/format'
import { formatDateKey } from '@/lib/time-zone'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price_cents: number
  category: string
}

type Slot = { startMinutes: number; startsAt: string }

type Props = {
  services: Service[]
  initialServiceId?: string
  mode: 'guest' | 'client'
  initialDate?: string
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function nextDays(count: number): string[] {
  const today = new Date()
  const base = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12))
  return Array.from({ length: count }, (_, index) =>
    new Date(base.getTime() + index * 86400000).toISOString().slice(0, 10),
  )
}

function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

export function BookingWidget({ services, initialServiceId, mode, initialDate }: Props) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? '')
  const days = useMemo(() => nextDays(21), [])
  const [date, setDate] = useState(initialDate ?? days[0])
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const service = services.find((item) => item.id === serviceId)

  useEffect(() => {
    if (!serviceId || !date) return
    let cancelled = false
    setLoadingSlots(true)
    setSelected(null)
    setWarning('')

    fetch(`/api/sito/slot?service=${serviceId}&date=${date}`)
      .then(async (response) => {
        const body = await response.json()
        if (cancelled) return
        if (!response.ok || !body.ok) {
          setSlots([])
          setWarning(body.error ?? 'Orari non disponibili.')
          return
        }
        setSlots(body.data.slots as Slot[])
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([])
          setWarning('Non riesco a caricare gli orari. Riprova.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, date])

  function timeLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!service || selected === null) {
      setError('Scegli un orario.')
      return
    }
    if (mode === 'guest') {
      router.push(`/registrati?servizio=${serviceId}`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/clienti/richiedi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, date, startMinutes: selected, notes }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Richiesta non riuscita.')
        return
      }
      router.push(`/area-clienti/prenota-confermata?id=${body.data.id}`)
      router.refresh()
    } catch {
      setError('Connessione non disponibile. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!services.length) {
    return (
      <div className='card'>
        <p className='font-display text-2xl'>Nessun servizio disponibile</p>
        <p className='mt-2 text-sm text-muted'>Il listino verra pubblicato a breve.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className='space-y-8'>
      <div className='space-y-3'>
        <p className='field-label'>1. Servizio</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          {services.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => setServiceId(item.id)}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                item.id === serviceId ? 'border-ink bg-ink text-paper' : 'border-line bg-white hover:border-ink'
              }`}
              aria-pressed={item.id === serviceId}
            >
              <span>
                <span className='block font-medium'>{item.name}</span>
                <span className={item.id === serviceId ? 'text-paper/60' : 'text-muted'}>
                  {formatMinutes(item.duration_minutes)}
                </span>
              </span>
              <span className='font-display text-lg'>{formatPrice(item.price_cents)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-3'>
        <p className='field-label'>2. Giorno</p>
        <div className='-mx-1 flex gap-2 overflow-x-auto pb-2'>
          {days.map((day) => {
            const info = formatDateKey(day)
            const active = day === date
            return (
              <button
                key={day}
                type='button'
                onClick={() => setDate(day)}
                className={`min-w-20 shrink-0 rounded-lg border px-3 py-3 text-center text-sm transition ${
                  active ? 'border-ink bg-ink text-paper' : 'border-line bg-white hover:border-ink'
                }`}
                aria-pressed={active}
              >
                <span className='block text-[0.68rem] uppercase tracking-[0.12em]'>
                  {WEEKDAYS[weekdayOf(day)]}
                </span>
                <span className='block font-display text-xl leading-tight'>{info.day}</span>
                <span className='block text-[0.65rem] uppercase tracking-[0.08em]'>{info.month.slice(0, 3)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className='space-y-3'>
        <p className='field-label'>3. Orario</p>
        {loadingSlots ? (
          <p className='text-sm text-muted'>Cerco gli orari liberi...</p>
        ) : slots && slots.length > 0 ? (
          <div className='grid grid-cols-3 gap-2 sm:grid-cols-5'>
            {slots.map((slot) => (
              <button
                key={slot.startMinutes}
                type='button'
                onClick={() => setSelected(slot.startMinutes)}
                className={`rounded-lg border px-2 py-3 text-sm transition ${
                  selected === slot.startMinutes
                    ? 'border-gold bg-gold-soft text-ink'
                    : 'border-line bg-white hover:border-ink'
                }`}
                aria-pressed={selected === slot.startMinutes}
              >
                {timeLabel(slot.startMinutes)}
              </button>
            ))}
          </div>
        ) : (
          <p className='rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted'>
            {warning || 'Nessun orario libero in questa giornata. Prova un altro giorno.'}
          </p>
        )}
      </div>

      <div className='space-y-3'>
        <label className='field-label' htmlFor='booking-notes'>Note (facoltative)</label>
        <textarea
          id='booking-notes'
          className='field-textarea min-h-24'
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder='Es. capelli lunghi, allergie, richieste particolari'
        />
      </div>

      {error && <p className='text-sm text-danger' role='alert'>{error}</p>}

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-muted'>
          {mode === 'client'
            ? 'La richiesta va in attesa: il salone la conferma e ricevi una email.'
            : 'Per prenotare serve un account clienti: e gratis e richiede meno di un minuto.'}
        </p>
        <button
          type='submit'
          className='btn-primary shrink-0'
          disabled={submitting || selected === null}
        >
          {mode === 'client' ? (submitting ? 'Invio...' : 'Richiedi appuntamento') : 'Continua'}
        </button>
      </div>
    </form>
  )
}
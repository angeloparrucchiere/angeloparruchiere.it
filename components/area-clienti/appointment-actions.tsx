'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatDateTime, formatPrice, STATUS_CLASS, STATUS_LABEL } from '@/lib/format'

type Appointment = {
  id: string
  starts_at: string
  status: string
  service_name: string
  service_price_cents: number
  staff_name: string
}

export function AppointmentActions({ appointment, canMove }: { appointment: Appointment; canMove: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [moved, setMoved] = useState<string | null>(null)

  async function cancel() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/clienti/annulla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Annullamento non riuscito.')
        return
      }
      router.refresh()
    } catch {
      setError('Connessione non disponibile.')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  async function moveTo(nextStartsAt: string, nextMinutes: number, nextDate: string) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/clienti/riprogramma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, date: nextDate, startMinutes: nextMinutes }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Spostamento non riuscito.')
        return
      }
      setMoved(nextStartsAt)
      router.refresh()
    } catch {
      setError('Connessione non disponibile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-3'>
      {moved && <p className='text-xs text-success'>Spostato: {formatDateTime(moved)}. In attesa di conferma.</p>}
      {error && <p className='text-xs text-danger' role='alert'>{error}</p>}

      {appointment.status === 'richiesto' || appointment.status === 'confermato' ? (
        <div className='flex flex-wrap items-center gap-2'>
          {canMove && (
            <ReschedulePicker
              appointmentId={appointment.id}
              disabled={busy}
              onPick={(date, minutes, startsAt) => moveTo(startsAt, minutes, date)}
            />
          )}
          {confirming ? (
            <>
              <button type='button' className='btn-danger' onClick={cancel} disabled={busy}>
                {busy ? 'Annullo...' : 'Confermo annullamento'}
              </button>
              <button type='button' className='btn-ghost' onClick={() => setConfirming(false)} disabled={busy}>
                No, lascia
              </button>
            </>
          ) : (
            <button type='button' className='btn-ghost' onClick={() => setConfirming(true)}>
              Annulla
            </button>
          )}
        </div>
      ) : (
        <span className={`status-pill border ${STATUS_CLASS[appointment.status] ?? ''}`}>
          {STATUS_LABEL[appointment.status] ?? appointment.status}
        </span>
      )}
      <p className='text-xs text-muted'>{formatPrice(appointment.service_price_cents)} · {appointment.staff_name}</p>
    </div>
  )
}

function ReschedulePicker({
  appointmentId,
  disabled,
  onPick,
}: {
  appointmentId: string
  disabled: boolean
  onPick: (date: string, minutes: number, startsAt: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Array<{ startMinutes: number; startsAt: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadDate(value: string) {
    setDate(value)
    setSlots([])
    setError('')
    if (!value) return
    setLoading(true)
    try {
      const response = await fetch(`/api/calendario?date=${value}`)
      const body = await response.json()
      if (!response.ok || !body.ok) {
        setError(body.error ?? 'Orari non disponibili.')
        return
      }
      setSlots(body.data.slots as Array<{ startMinutes: number; startsAt: string }>)
    } catch {
      setError('Connessione non disponibile.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button type='button' className='btn-ghost' onClick={() => setOpen(true)} disabled={disabled}>
        Sposta
      </button>
    )
  }

  return (
    <div className='w-full space-y-2 rounded-lg border border-line bg-paper/60 p-3'>
      <div className='flex items-center gap-2'>
        <label className='sr-only' htmlFor={`move-date-${appointmentId}`}>Nuova data</label>
        <input
          id={`move-date-${appointmentId}`}
          type='date'
          className='field-input'
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => loadDate(event.target.value)}
        />
        <button type='button' className='text-xs underline' onClick={() => setOpen(false)}>
          Chiudi
        </button>
      </div>
      {loading && <p className='text-xs text-muted'>Cerco gli orari...</p>}
      {error && <p className='text-xs text-danger'>{error}</p>}
      {date && !loading && slots.length === 0 && !error && (
        <p className='text-xs text-muted'>Nessun orario libero in questa data.</p>
      )}
      {slots.length > 0 && (
        <div className='grid grid-cols-4 gap-1'>
          {slots.map((slot) => (
            <button
              key={slot.startMinutes}
              type='button'
              className='rounded border border-line bg-white px-1 py-2 text-xs hover:border-ink'
              disabled={disabled}
              onClick={() => onPick(date, slot.startMinutes, slot.startsAt)}
            >
              {String(Math.floor(slot.startMinutes / 60)).padStart(2, '0')}:{String(slot.startMinutes % 60).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateSlots, isRangeFree, windowsForWeekday } from '../lib/slots.ts'
import { addDaysToKey, parseTimeToMinutes, utcToZonedParts, zonedTimeToUtc } from '../lib/time-zone.ts'

const window = { weekday: 1, startMinutes: parseTimeToMinutes('09:00'), endMinutes: parseTimeToMinutes('12:00') }

test('una fascia oraria vale solo per il suo giorno della settimana', () => {
  assert.equal(windowsForWeekday([window], 1).length, 1)
  assert.equal(windowsForWeekday([window], 2).length, 0)
})

test('i blocchi impediscono le sovrapposizioni', () => {
  assert.equal(isRangeFree(600, 630, [{ start: 620, end: 700 }]), false)
  assert.equal(isRangeFree(600, 620, [{ start: 620, end: 700 }]), true)
  assert.equal(isRangeFree(700, 730, [{ start: 620, end: 700 }]), true)
})

test('con una pausa pranzo nessuno slot la attraversa', () => {
  const windows = [
    { start: parseTimeToMinutes('09:00'), end: parseTimeToMinutes('13:00') },
    { start: parseTimeToMinutes('14:00'), end: parseTimeToMinutes('19:00') },
  ]
  const dateKey = '2030-01-07'
  const slots = generateSlots(windows, [], {
    durationMinutes: 60,
    stepMinutes: 30,
    minLeadMinutes: 0,
    now: new Date('2030-01-01T00:00:00Z'),
    toInstant: (minutes) => zonedTimeToUtc(dateKey, minutes),
  })
  const crossesLunch = slots.some((slot) => slot.startMinutes < 13 * 60 && slot.endMinutes > 13 * 60)
  assert.equal(crossesLunch, false)
  assert.equal(slots.at(-1)?.endMinutes, 19 * 60)
})

test('gli slot nel passato o sotto il preavviso minimo sono esclusi', () => {
  const dateKey = '2030-01-07'
  const slots = generateSlots([{ start: window.startMinutes, end: window.endMinutes }], [], {
    durationMinutes: 30,
    stepMinutes: 30,
    minLeadMinutes: 24 * 60,
    now: new Date('2030-01-07T06:00:00Z'),
    toInstant: (minutes) => zonedTimeToUtc(dateKey, minutes),
  })
  assert.equal(slots.length, 0)
})

test('orario di Roma in inverno e in estate', () => {
  assert.equal(zonedTimeToUtc('2030-01-15', 600).toISOString(), '2030-01-15T09:00:00.000Z')
  assert.equal(zonedTimeToUtc('2030-07-15', 600).toISOString(), '2030-07-15T08:00:00.000Z')
})

test('la notte del cambio ora legale: 02:30 non esiste e scivola alle 03:30', () => {
  assert.equal(zonedTimeToUtc('2030-03-31', 150).toISOString(), '2030-03-31T01:30:00.000Z')
})

test('andata e ritorno tra UTC e ora di Roma', () => {
  const instant = zonedTimeToUtc('2030-06-15', 150)
  const parts = utcToZonedParts(instant)
  assert.equal(parts.dateKey, '2030-06-15')
  assert.equal(parts.minutes, 150)
})

test('aggiungere giorni attraversa i mesi', () => {
  assert.equal(addDaysToKey('2030-01-31', 1), '2030-02-01')
  assert.equal(addDaysToKey('2030-12-31', 1), '2031-01-01')
  assert.equal(addDaysToKey('2030-03-02', -1), '2030-03-01')
})
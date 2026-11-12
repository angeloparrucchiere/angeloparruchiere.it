import type { Metadata } from 'next'
import { StaffDashboard } from '@/components/staff/staff-dashboard'
import { getAgenda, getPendingRequests } from '@/lib/db/staff'
import { todayKey } from '@/lib/time-zone'

export const metadata: Metadata = { title: 'Prenotazioni staff', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Search = Promise<{ data?: string }>

export default async function StaffPrenotazioniPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams
  const date = params.data && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : todayKey()

  const [pending, agenda] = await Promise.all([
    getPendingRequests().catch(() => []),
    getAgenda(date).catch(() => []),
  ])

  return <StaffDashboard pending={pending} agenda={agenda} initialDate={date} />
}
import { cookies } from 'next/headers'
import { SiteHeader } from '@/components/sito/site-header'
import { SiteFooter } from '@/components/sito/site-footer'
import { getSessionUser } from '@/lib/auth'
import { STAFF_COOKIE } from '@/lib/staff-access'

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser().catch(() => null)
  const isStaff = session?.profile.role === 'staff' || session?.profile.role === 'admin'
  const cookieStore = await cookies()
  const staffCookie = Boolean(cookieStore.get(STAFF_COOKIE)?.value)

  return (
    <div className='flex min-h-screen flex-col'>
      <SiteHeader isLoggedIn={Boolean(session)} isStaff={isStaff} />
      <main className='flex-1'>{children}</main>
      <SiteFooter />
      {isStaff && !staffCookie ? <StaffShortcut /> : null}
    </div>
  )
}

function StaffShortcut() {
  return (
    <a
      href='/staff/entra'
      className='fixed bottom-5 right-5 z-50 rounded-full border border-ink bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold shadow-lg'
    >
      Apri pannello staff
    </a>
  )
}
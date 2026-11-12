import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { ProfileForm } from '@/components/area-clienti/profile-form'

export const metadata: Metadata = {
  title: 'Il tuo profilo',
  robots: { index: false },
}

export default async function ProfiloPage() {
  const session = await getSessionUser().catch(() => null)
  if (!session) redirect('/accedi?next=/area-clienti/profilo')

  return (
    <div className='container-site py-14'>
      <div className='max-w-xl space-y-6'>
        <div className='space-y-2'>
          <p className='eyebrow'>Area clienti</p>
          <h1 className='text-4xl'>Il tuo profilo.</h1>
          <p className='text-sm text-muted'>Tieni aggiornati i contatti: ci servono per conferme e promemoria.</p>
        </div>

        <ProfileForm
          email={session.email}
          initial={{
            firstName: session.profile.first_name,
            lastName: session.profile.last_name,
            phone: session.profile.phone ?? '',
            marketingConsent: session.profile.marketing_consent,
          }}
        />

        <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
          <Link href='/password-dimenticata' className='text-muted underline hover:text-gold'>Cambia password</Link>
          <form action='/api/account/esci' method='post'>
            <button type='submit' className='text-muted underline hover:text-gold'>Esci dall&apos;account</button>
          </form>
        </div>
      </div>
    </div>
  )
}
import { ok, fail, parseBody, readJson } from '@/lib/api'
import { requireStaffSession, staffAuthError } from '@/lib/staff-session'
import { linkStaffSchema } from '@/lib/validation/schemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrQueue } from '@/lib/email/send'

/**
 * Aggancia un account gia registrato (email) al pannello staff o admin.
 * Va fatto una volta dal titolare; da qui in poi il pannello si apre con
 * le credenziali di quell'account.
 */
export async function POST(request: Request) {
  try {
    const session = await requireStaffSession(request)
    if (session.profile.role !== 'admin') return fail('Solo un amministratore puo abilitare lo staff.', 403)

    const parsed = parseBody(linkStaffSchema, await readJson(request))
    if (!parsed.success) return parsed.response

    const admin = createAdminClient()
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listError) throw listError
    const user = list.users.find((item) => item.email?.toLowerCase() === parsed.data.email.toLowerCase())
    if (!user) return fail('Quell email non ha un account. Prima registrati dal sito, poi torna qui.', 404)

    const { error: roleError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role: parsed.data.role,
      },
    })
    if (roleError) throw roleError

    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: parsed.data.role })
      .eq('id', user.id)
    if (profileError) throw profileError

    if (parsed.data.role === 'staff') {
      const { data: existing } = await admin
        .from('staff')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()
      if (!existing) {
        await admin.from('staff').insert({
          profile_id: user.id,
          display_name: parsed.data.displayName,
          title: parsed.data.title || 'Parrucchiere',
          sort_order: 90,
        })
      }
    }

    if (user.email) {
      await sendOrQueue({
        to: user.email,
        kind: 'staff_abilitato',
        content: {
          subject: 'Accesso staff abilitato',
          html: `<p>Il tuo account ora ha accesso al pannello staff di ${process.env.NEXT_PUBLIC_SITE_URL ?? 'angeloparruchiere.it'}.</p>`,
          text: 'Il tuo account ora ha accesso al pannello staff.',
        },
      })
    }

    return ok({ linked: true })
  } catch (error) {
    return staffAuthError(error) ?? fail('Abilitazione non riuscita.', 500)
  }
}
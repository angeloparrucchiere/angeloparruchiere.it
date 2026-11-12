import type { Metadata } from 'next'
import { PublicShell } from '@/components/sito/public-shell'

export const metadata: Metadata = {
  title: {
    default: 'Angeloparruchiere - Salone di parrucchiere',
    template: '%s | Angeloparruchiere',
  },
}

export default function SitoLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>
}
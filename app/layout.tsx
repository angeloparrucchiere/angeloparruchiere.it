import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Angeloparruchiere - Salone di parrucchiere',
    template: '%s | Angeloparruchiere',
  },
  description:
    'Salone di parrucchiere per uomo e donna: taglio, barba, colore, piega e trattamenti. Prenotazioni online e area clienti.',
  applicationName: 'Angeloparruchiere',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: 'Angeloparruchiere',
    title: 'Angeloparruchiere - Salone di parrucchiere',
    description: 'Taglio, barba, colore e trattamenti. Prenota online.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='it' className={`${inter.variable} ${cormorant.variable}`}>
      <body className='font-sans'>{children}</body>
    </html>
  )
}
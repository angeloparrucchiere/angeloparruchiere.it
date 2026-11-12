import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Pannello staff',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className='bg-ink'>{children}</div>
}
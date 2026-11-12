import Link from 'next/link'

type Props = { inverted?: boolean }

export function Logo({ inverted = false }: Props) {
  return (
    <Link
      href='/'
      className={`font-display text-xl leading-none tracking-[0.18em] ${
        inverted ? 'text-paper' : 'text-ink'
      }`}
      aria-label='Angeloparruchiere, torna alla home'
    >
      ANGELO
      <span className='text-gold'>.</span>
      PARRUCHIERE
    </Link>
  )
}
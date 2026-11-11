import Link from 'next/link'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
        <h1 className='text-4xl font-bold mb-8'>Salone di Parrucchiere Angeloparruchiere</h1>
        <p className='text-lg mb-4'>Benvenuti nel salone: taglio, coloring, trattamenti e area clienti.</p>
        <div className='flex gap-4'>
          <Link href='/servizi' className='bg-black text-white px-4 py-2 rounded'>
            I nostri servizi
          </Link>
          <Link href='/prenotazioni' className='bg-gray-200 px-4 py-2 rounded'>
            Prenota ora
          </Link>
        </div>
      </div>
    </main>
  )
}
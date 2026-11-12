'use client'

import { useState } from 'react'

type Props = {
  id: string
  name: string
  autoComplete?: string
  required?: boolean
  value?: string
  onChange?: (value: string) => void
}

export function PasswordField({ id, name, autoComplete = 'new-password', required = true, value, onChange }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className='relative'>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        className='field-input pr-20'
        {...(onChange ? { value, onChange: (event) => onChange(event.target.value) } : {})}
      />
      <button
        type='button'
        onClick={() => setVisible((current) => !current)}
        className='absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.1em] text-muted hover:text-ink'
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        aria-pressed={visible}
      >
        {visible ? 'Nascondi' : 'Mostra'}
      </button>
    </div>
  )
}
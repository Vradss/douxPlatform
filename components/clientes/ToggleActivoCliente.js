'use client'

import { useState, useTransition } from 'react'
import { toggleActivoCliente } from '@/app/actions/clientes'

export default function ToggleActivoCliente({ id, activo: initialActivo }) {
  const [activo, setActivo] = useState(initialActivo)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const nuevo = !activo
    setActivo(nuevo)
    startTransition(() => toggleActivoCliente(id, nuevo))
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={activo ? 'Click para desactivar' : 'Click para activar'}
      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
        activo
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      {activo ? 'SI' : 'NO'}
    </button>
  )
}

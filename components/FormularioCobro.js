// Formulario para registrar un cobro — Client Component
'use client'

import { useState } from 'react'
import { registrarCobro } from '@/app/actions/cobros'
import { useRouter } from 'next/navigation'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

const METODOS = [
  { valor: 'transferencia', label: 'Transferencia bancaria' },
  { valor: 'efectivo', label: 'Efectivo' },
  { valor: 'deposito', label: 'Depósito bancario' },
  { valor: 'yape', label: 'Yape' },
  { valor: 'plin', label: 'Plin' },
  { valor: 'otro', label: 'Otro' },
]

export default function FormularioCobro({ clientes, clientePreseleccionado }) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clientePreseleccionado || '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Obtener saldo del cliente seleccionado
  const cliente = clientes.find((c) => c.id === clienteSeleccionado)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.target)
    const resultado = await registrarCobro(formData)

    if (resultado?.error) {
      setError(resultado.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cliente <span className="text-red-500">*</span>
        </label>
        <select
          name="cliente_id"
          required
          value={clienteSeleccionado}
          onChange={(e) => setClienteSeleccionado(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.razon_social}</option>
          ))}
        </select>
        {/* Mostrar saldo actual del cliente */}
        {cliente && (
          <p className={`text-sm mt-1 ${cliente.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Saldo actual: {formatearSoles(cliente.saldo_pendiente)}
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha <span className="text-red-500">*</span>
        </label>
        <input
          name="fecha"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto (S/) <span className="text-red-500">*</span>
        </label>
        <input
          name="monto"
          type="number"
          min="0.01"
          step="0.01"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="0.00"
        />
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Método de pago <span className="text-red-500">*</span>
        </label>
        <select
          name="metodo_pago"
          required
          defaultValue="transferencia"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {METODOS.map((m) => (
            <option key={m.valor} value={m.valor}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Referencia / N° operación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          N° Operación / Referencia
        </label>
        <input
          name="referencia"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Ej: 123456789"
        />
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <input
          name="observaciones"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Notas adicionales..."
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Guardando...' : 'Registrar Cobro'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-gray-200 hover:border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

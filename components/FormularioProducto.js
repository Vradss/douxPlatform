'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400'

export default function FormularioProducto({ accion, producto, stockData }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.target)
    const resultado = await accion(formData)
    if (resultado?.error) {
      setError(resultado.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
          <input
            name="codigo"
            defaultValue={producto?.codigo}
            className={inputClass}
            placeholder="Ej: DB-688G"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <input
            name="categoria"
            defaultValue={producto?.categoria}
            className={inputClass}
            placeholder="Ej: BANERA, TRICICLO"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre}
          className={inputClass}
          placeholder="Nombre del producto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación almacén</label>
          <input
            name="ubicacion_almacen"
            defaultValue={producto?.ubicacion_almacen}
            className={inputClass}
            placeholder="Ej: HIELO, DEPARTAMENTO"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cant. por caja</label>
          <input
            name="cantidad_por_caja"
            type="number"
            min="1"
            defaultValue={producto?.cantidad_por_caja}
            className={inputClass}
            placeholder="Unidades"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta (S/)</label>
          <input
            name="precio_venta_real"
            type="number"
            min="0"
            step="0.01"
            defaultValue={producto?.precio_venta_real}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio SUNAT (S/)</label>
          <input
            name="precio_sunat"
            type="number"
            min="0"
            step="0.01"
            defaultValue={producto?.precio_sunat}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Real</label>
          <input
            name="stock_real"
            type="number"
            min="0"
            defaultValue={stockData?.stock_real ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock SUNAT</label>
          <input
            name="stock_sunat"
            type="number"
            min="0"
            defaultValue={stockData?.stock_sunat ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-gray-200 hover:border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

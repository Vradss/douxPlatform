'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PERFILES_PAGO = [
  'BUEN PAGADOR',
  'BUEN PAGADOR PUNTUAL',
  'PAGA PERO HAY QUE PRESIONAR',
  'MAL PAGADOR',
  'SIN HISTORIAL',
]

const inputCls = 'w-full border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white'
const labelCls = 'block text-sm font-medium text-[#1A1A2E] mb-1'

export default function FormularioCliente({ accion, cliente }) {
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Fila 1: tipo_doc + num_doc */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Tipo doc.</label>
          <select name="tipo_doc" defaultValue={cliente?.tipo_doc ?? 'RUC'} className={inputCls}>
            <option value="RUC">RUC</option>
            <option value="DNI">DNI</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Número de documento</label>
          <input
            name="num_doc"
            defaultValue={cliente?.num_doc ?? cliente?.ruc}
            className={inputCls}
            placeholder="20600195779"
          />
        </div>
      </div>

      {/* Razón Social */}
      <div>
        <label className={labelCls}>
          Razón Social <span className="text-red-500">*</span>
        </label>
        <input
          name="razon_social"
          required
          defaultValue={cliente?.razon_social}
          className={inputCls}
          placeholder="Nombre legal completo"
        />
      </div>

      {/* Nombre WhatsApp */}
      <div>
        <label className={labelCls}>Nombre WhatsApp</label>
        <input
          name="nombre_whatsapp"
          defaultValue={cliente?.nombre_whatsapp}
          className={inputCls}
          placeholder="Como aparece guardado en el celular"
        />
      </div>

      {/* Celular + Email */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Celular</label>
          <input
            name="celular"
            defaultValue={cliente?.celular ?? cliente?.telefono}
            className={inputCls}
            placeholder="999 999 999"
          />
        </div>
        <div>
          <label className={labelCls}>Correo electrónico</label>
          <input
            name="email"
            type="email"
            defaultValue={cliente?.email}
            className={inputCls}
            placeholder="cliente@empresa.com"
          />
        </div>
      </div>

      {/* Dirección Fiscal */}
      <div>
        <label className={labelCls}>Dirección Fiscal</label>
        <textarea
          name="direccion"
          defaultValue={cliente?.direccion}
          rows={2}
          className={inputCls}
          placeholder="Av. Lima 123, Miraflores"
        />
      </div>

      {/* Dirección 1 */}
      <div>
        <label className={labelCls}>Dirección 1</label>
        <textarea
          name="direccion_1"
          defaultValue={cliente?.direccion_1}
          rows={2}
          className={inputCls}
          placeholder="Dirección alternativa o de entrega"
        />
      </div>

      {/* Tipo Venta + Cómo se cobra */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo de Venta</label>
          <select name="tipo_venta" defaultValue={cliente?.tipo_venta ?? 'contado'} className={inputCls}>
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Cómo se cobra</label>
          <select name="como_se_cobra" defaultValue={cliente?.como_se_cobra ?? ''} className={inputCls}>
            <option value="">Lima</option>
            <option value="CAMPO">Campo (fuera de Lima)</option>
          </select>
        </div>
      </div>

      {/* Perfil de pago */}
      <div>
        <label className={labelCls}>Perfil de pago</label>
        <select name="perfil_pago" defaultValue={cliente?.perfil_pago ?? ''} className={inputCls}>
          <option value="">Sin perfil</option>
          {PERFILES_PAGO.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Comportamiento de pago */}
      <div>
        <label className={labelCls}>Comportamiento de pago</label>
        <textarea
          name="comportamiento_pago"
          defaultValue={cliente?.comportamiento_pago}
          rows={3}
          className={inputCls}
          placeholder="Descripción del comportamiento de pago del cliente..."
        />
      </div>

      {/* Perfil de compra */}
      <div>
        <label className={labelCls}>Perfil de compra del cliente</label>
        <input
          name="perfil_compra"
          defaultValue={cliente?.perfil_compra}
          className={inputCls}
          placeholder="Ej: COMPRADOR FRECUENTE"
        />
      </div>

      {/* Comportamiento de compra */}
      <div>
        <label className={labelCls}>Comportamiento de compra</label>
        <textarea
          name="comportamiento_compra"
          defaultValue={cliente?.comportamiento_compra}
          rows={3}
          className={inputCls}
          placeholder="Descripción del comportamiento de compra..."
        />
      </div>

      {/* Deuda inicial */}
      <div>
        <label className={labelCls}>Deuda inicial (S/)</label>
        <input
          name="deuda_inicial"
          type="number"
          step="0.01"
          min="0"
          defaultValue={cliente?.deuda_inicial ?? 0}
          className={inputCls}
          placeholder="0.00"
        />
        <p className="text-xs text-gray-400 mt-1">Saldo previo al sistema (importado de Excel). Usar 0 si no hay deuda.</p>
      </div>

      {/* Activo — solo en edición */}
      {cliente && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            value="true"
            defaultChecked={cliente?.activo !== false}
            className="w-4 h-4 accent-[#4B5EEF]"
          />
          <label htmlFor="activo" className="text-sm text-[#1A1A2E]">Cliente activo</label>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#4B5EEF] hover:bg-[#3a4edf] disabled:bg-[#9aa5f7] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 px-5 py-2 rounded-lg text-sm font-medium border border-[#B8C2FF] hover:border-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

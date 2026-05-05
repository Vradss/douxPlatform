'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { actualizarClienteInline } from '@/app/actions/clientes'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  entregado: { label: 'Entregado', cls: 'bg-blue-100 text-blue-600' },
  anulada: { label: 'Anulada', cls: 'bg-gray-100 text-gray-400 line-through' },
}

const METODO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  deposito: 'Depósito', yape: 'Yape', plin: 'Plin', otro: 'Otro',
}

const PERFILES_PAGO = [
  'BUEN PAGADOR', 'BUEN PAGADOR PUNTUAL',
  'PAGA PERO HAY QUE PRESIONAR', 'MAL PAGADOR', 'SIN HISTORIAL',
]

const inputCls = 'w-full border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white'
const labelCls = 'block text-xs text-gray-400 uppercase tracking-wide mb-1'

function TabInfo({ cliente }) {
  const accion = actualizarClienteInline.bind(null, cliente.id)
  const [state, formAction, pending] = useActionState(accion, null)

  return (
    <div className="bg-white rounded-xl border border-[#B8C2FF] p-6">
      <form action={formAction} className="space-y-5">

        {/* Tipo Doc + Número */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Tipo Doc</label>
            <select name="tipo_doc" defaultValue={cliente.tipo_doc ?? 'RUC'} className={inputCls}>
              <option value="RUC">RUC</option>
              <option value="DNI">DNI</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Número de documento</label>
            <input name="num_doc" defaultValue={cliente.num_doc ?? ''} className={inputCls} placeholder="20600195779" />
          </div>
        </div>

        {/* Razón Social + Nombre WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Razón Social <span className="text-red-400">*</span></label>
            <input name="razon_social" required defaultValue={cliente.razon_social ?? ''} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nombre WhatsApp</label>
            <input name="nombre_whatsapp" defaultValue={cliente.nombre_whatsapp ?? ''} className={inputCls} placeholder="Como aparece en el celular" />
          </div>
        </div>

        {/* Celular + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Celular</label>
            <input name="celular" defaultValue={cliente.celular ?? ''} className={inputCls} placeholder="999 999 999" />
          </div>
          <div>
            <label className={labelCls}>Email Principal</label>
            <input name="email" type="email" defaultValue={cliente.email ?? ''} className={inputCls} placeholder="cliente@empresa.com" />
          </div>
        </div>

        {/* Dirección Fiscal */}
        <div>
          <label className={labelCls}>Dirección Fiscal</label>
          <textarea name="direccion" defaultValue={cliente.direccion ?? ''} rows={2} className={inputCls} placeholder="Av. Lima 123, Miraflores" />
        </div>

        {/* Dirección 1 */}
        <div>
          <label className={labelCls}>Dirección 1</label>
          <textarea name="direccion_1" defaultValue={cliente.direccion_1 ?? ''} rows={2} className={inputCls} placeholder="Dirección alternativa o de entrega" />
        </div>

        {/* Activo + Tipo de Venta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Activo</label>
            <select name="activo" defaultValue={cliente.activo !== false ? 'true' : 'false'} className={inputCls}>
              <option value="true">SI</option>
              <option value="false">NO</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo de venta</label>
            <select name="tipo_venta" defaultValue={cliente.tipo_venta ?? 'contado'} className={inputCls}>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
        </div>

        {/* Perfil de pago + Comportamiento de pago */}
        <div>
          <label className={labelCls}>Perfil de pago del cliente</label>
          <select name="perfil_pago" defaultValue={cliente.perfil_pago ?? ''} className={inputCls}>
            <option value="">Sin perfil</option>
            {PERFILES_PAGO.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Comportamiento de pago</label>
          <textarea name="comportamiento_pago" defaultValue={cliente.comportamiento_pago ?? ''} rows={3} className={inputCls} placeholder="Notas sobre el comportamiento de pago..." />
        </div>

        {/* Perfil de compra + Comportamiento de compra */}
        <div>
          <label className={labelCls}>Perfil de compra del cliente</label>
          <input name="perfil_compra" defaultValue={cliente.perfil_compra ?? ''} className={inputCls} placeholder="Ej: COMPRADOR FRECUENTE" />
        </div>
        <div>
          <label className={labelCls}>Comportamiento de compra</label>
          <textarea name="comportamiento_compra" defaultValue={cliente.comportamiento_compra ?? ''} rows={3} className={inputCls} placeholder="Notas sobre el comportamiento de compra..." />
        </div>

        {/* Feedback */}
        {state?.error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">Cambios guardados correctamente.</p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={pending}
            className="bg-[#4B5EEF] hover:bg-[#3a4edf] disabled:bg-[#9aa5f7] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {pending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function TabsCliente({ cliente, notas, cobros }) {
  const [tab, setTab] = useState('notas')

  return (
    <div>
      {/* Tab selector */}
      <div className="flex border-b border-[#B8C2FF] mb-4">
        {[
          { key: 'notas', label: `Notas de Pedido (${notas?.length ?? 0})` },
          { key: 'cobros', label: `Cobros (${cobros?.length ?? 0})` },
          { key: 'info', label: 'Información' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-[#4B5EEF] text-[#4B5EEF]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Notas de Pedido */}
      {tab === 'notas' && (
        <div className="bg-white rounded-xl border border-[#B8C2FF] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
              <tr>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">N°</th>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Fecha</th>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Estado</th>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Comprobante</th>
                <th className="text-right px-4 py-2.5 text-[#1A1A2E] font-semibold">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!notas?.length && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Sin notas de pedido</td></tr>
              )}
              {notas?.map((np) => {
                const est = ESTADO_CONFIG[np.estado] ?? { label: np.estado, cls: 'bg-gray-100 text-gray-500' }
                return (
                  <tr key={np.id} className="hover:bg-[#F7F8F8]">
                    <td className="px-4 py-2.5 font-mono font-medium text-[#1A1A2E]">{np.numero}</td>
                    <td className="px-4 py-2.5 text-gray-500">{formatearFecha(np.fecha)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.cls}`}>{est.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 capitalize">
                      {np.tipo_comprobante === 'ninguno' ? '—' : np.tipo_comprobante}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#1A1A2E]">
                      {formatearSoles(np.total)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/notas-pedido/${np.id}`} className="text-[#4B5EEF] hover:text-[#3a4edf] text-xs">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Cobros */}
      {tab === 'cobros' && (
        <div className="bg-white rounded-xl border border-[#B8C2FF] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
              <tr>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Fecha</th>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Método</th>
                <th className="text-left px-4 py-2.5 text-[#1A1A2E] font-semibold">Referencia</th>
                <th className="text-right px-4 py-2.5 text-[#1A1A2E] font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!cobros?.length && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">Sin cobros registrados</td></tr>
              )}
              {cobros?.map((cobro) => (
                <tr key={cobro.id} className="hover:bg-[#F7F8F8]">
                  <td className="px-4 py-2.5 text-gray-500">{formatearFecha(cobro.fecha)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{METODO_LABEL[cobro.metodo_pago] ?? cobro.metodo_pago}</td>
                  <td className="px-4 py-2.5 text-gray-400">{cobro.numero_recibo || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green-600">
                    {formatearSoles(cobro.monto_cobrado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Información */}
      {tab === 'info' && <TabInfo cliente={cliente} />}
    </div>
  )
}

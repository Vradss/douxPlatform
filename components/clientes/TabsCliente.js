'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const PERFIL_CONFIG = {
  'BUEN PAGADOR': 'bg-green-100 text-green-700',
  'BUEN PAGADOR PUNTUAL': 'bg-green-100 text-green-700',
  'PAGA PERO HAY QUE PRESIONAR': 'bg-yellow-100 text-yellow-700',
}

export default function TabsCliente({ cliente, notas, cobros }) {
  const [tab, setTab] = useState('notas')

  const perfilCls = cliente.perfil_pago
    ? (PERFIL_CONFIG[cliente.perfil_pago] ?? 'bg-gray-100 text-gray-500')
    : null

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
                  <td className="px-4 py-2.5 text-gray-400">{cobro.referencia || '—'}</td>
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
      {tab === 'info' && (
        <div className="bg-white rounded-xl border border-[#B8C2FF] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Razón Social</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.razon_social}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nombre WhatsApp</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.nombre_whatsapp || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Documento</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.tipo_doc} {cliente.num_doc || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Celular</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.celular || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Correo</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.direccion || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tipo de Venta</p>
              <p className="font-medium text-[#1A1A2E] capitalize">{cliente.tipo_venta}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cómo se cobra</p>
              <p className="font-medium text-[#1A1A2E]">{cliente.como_se_cobra || 'Lima'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Deuda inicial</p>
              <p className="font-medium text-[#1A1A2E]">{formatearSoles(cliente.deuda_inicial)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Perfil de pago</p>
              {cliente.perfil_pago
                ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${perfilCls}`}>{cliente.perfil_pago}</span>
                : <p className="text-gray-400">—</p>
              }
            </div>
          </div>
          {cliente.comportamiento_pago && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Comportamiento de pago</p>
              <p className="text-sm text-gray-600 bg-[#F7F8F8] rounded-lg p-3 border border-[#B8C2FF]">
                {cliente.comportamiento_pago}
              </p>
            </div>
          )}
          <div className="pt-2">
            <Link
              href={`/clientes/${cliente.id}/editar`}
              className="bg-[#4B5EEF] hover:bg-[#3a4edf] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
            >
              Editar información
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

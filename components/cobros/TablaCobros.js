'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const METODO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia',
  deposito: 'Depósito', yape: 'Yape', plin: 'Plin', otro: 'Otro',
}

function generarMeses() {
  const meses = []
  const ahora = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    meses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return meses
}

const MESES = generarMeses()

const selectCls = 'border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B5EEF]'

export default function TablaCobros({ cobros }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('todos')

  const hayFiltros = busqueda || filtroMes || filtroMetodo !== 'todos'

  function limpiar() {
    setBusqueda('')
    setFiltroMes('')
    setFiltroMetodo('todos')
  }

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return cobros.filter((c) => {
      if (filtroMes && !c.fecha.startsWith(filtroMes)) return false
      if (filtroMetodo !== 'todos' && c.metodo_pago !== filtroMetodo) return false
      if (!q) return true
      const nombre = (c.clientes?.razon_social || '').toLowerCase()
      const ref = (c.numero_recibo || '').toLowerCase()
      return nombre.includes(q) || ref.includes(q)
    })
  }, [cobros, busqueda, filtroMes, filtroMetodo])

  const totalFiltrado = filtrados.reduce((acc, c) => acc + (c.monto_cobrado ?? 0), 0)

  return (
    <>
      {/* Barra de filtros */}
      <div className="bg-white border border-[#B8C2FF] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[200px]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente o referencia…"
              className="w-full pl-9 pr-3 py-2 border border-[#B8C2FF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white"
            />
          </div>

          {/* Mes */}
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className={selectCls}>
            <option value="">Todos los meses</option>
            {MESES.map((m) => (
              <option key={m.valor} value={m.valor}>{m.label}</option>
            ))}
          </select>

          {/* Método de pago */}
          <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={selectCls}>
            <option value="todos">Método: Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="deposito">Depósito</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="otro">Otro</option>
          </select>

          {/* Limpiar */}
          {hayFiltros && (
            <button onClick={limpiar} className="text-sm text-[#4B5EEF] hover:text-[#3a4edf] font-medium whitespace-nowrap">
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contador y total */}
      <p className="text-xs text-gray-400 mb-2">
        {filtrados.length === cobros.length
          ? `${cobros.length} registros`
          : `${filtrados.length} de ${cobros.length} registros`}
        {' · '}
        <span className="font-medium text-gray-600">{formatearSoles(totalFiltrado)}</span>
      </p>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#B8C2FF] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Fecha</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Cliente</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Método</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Referencia</th>
              <th className="text-right px-4 py-3 text-[#1A1A2E] font-semibold">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  {hayFiltros ? 'Ningún cobro coincide con los filtros' : 'No hay cobros registrados'}
                </td>
              </tr>
            )}
            {filtrados.map((cobro) => (
              <tr key={cobro.id} className="hover:bg-[#F7F8F8] transition-colors">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatearFecha(cobro.fecha)}</td>
                <td className="px-4 py-3">
                  {cobro.clientes?.id
                    ? <Link href={`/clientes/${cobro.clientes.id}`} className="font-medium text-[#1A1A2E] hover:text-[#4B5EEF]">
                        {cobro.clientes.razon_social}
                      </Link>
                    : <span className="text-gray-500">{cobro.clientes?.razon_social || '—'}</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {METODO_LABEL[cobro.metodo_pago] ?? cobro.metodo_pago}
                </td>
                <td className="px-4 py-3 text-gray-400">{cobro.numero_recibo || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatearSoles(cobro.monto_cobrado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

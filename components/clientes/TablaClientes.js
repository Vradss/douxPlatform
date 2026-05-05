'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ToggleActivoCliente from './ToggleActivoCliente'

const PERFIL_CONFIG = {
  'BUEN PAGADOR': 'bg-green-100 text-green-700',
  'BUEN PAGADOR PUNTUAL': 'bg-green-100 text-green-700',
  'PAGA PERO HAY QUE PRESIONAR': 'bg-yellow-100 text-yellow-700',
  'MAL PAGADOR': 'bg-red-100 text-red-600',
}

function BadgePerfil({ perfil }) {
  if (!perfil) return <span className="text-xs text-gray-300">—</span>
  const cls = PERFIL_CONFIG[perfil] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${cls}`}>
      {perfil}
    </span>
  )
}

const selectCls = 'border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B5EEF]'

export default function TablaClientes({ clientes }) {
  const [busqueda, setBusqueda] = useState('')
  const [tipoVenta, setTipoVenta] = useState('todos')
  const [perfilPago, setPerfilPago] = useState('todos')
  const [activo, setActivo] = useState('todos')

  const hayFiltros = busqueda || tipoVenta !== 'todos' || perfilPago !== 'todos' || activo !== 'todos'

  function limpiar() {
    setBusqueda('')
    setTipoVenta('todos')
    setPerfilPago('todos')
    setActivo('todos')
  }

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return clientes.filter((c) => {
      if (tipoVenta !== 'todos' && c.tipo_venta !== tipoVenta) return false
      if (activo === 'activos' && c.activo === false) return false
      if (activo === 'inactivos' && c.activo !== false) return false
      if (perfilPago === 'buen_pagador') {
        if (c.perfil_pago !== 'BUEN PAGADOR' && c.perfil_pago !== 'BUEN PAGADOR PUNTUAL') return false
      } else if (perfilPago === 'sin_perfil') {
        if (c.perfil_pago) return false
      } else if (perfilPago !== 'todos') {
        if (c.perfil_pago !== perfilPago) return false
      }
      if (!q) return true
      return (
        (c.razon_social || '').toLowerCase().includes(q) ||
        (c.nombre_whatsapp || '').toLowerCase().includes(q) ||
        (c.num_doc || '').toLowerCase().includes(q) ||
        (c.celular || '').toLowerCase().includes(q)
      )
    })
  }, [clientes, busqueda, tipoVenta, perfilPago, activo])

  return (
    <>
      {/* Barra de filtros */}
      <div className="bg-white border border-[#B8C2FF] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[220px]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, RUC/DNI, celular…"
              className="w-full pl-9 pr-3 py-2 border border-[#B8C2FF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white"
            />
          </div>

          {/* Tipo Venta */}
          <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)} className={selectCls}>
            <option value="todos">Tipo venta: Todos</option>
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>

          {/* Perfil pago */}
          <select value={perfilPago} onChange={(e) => setPerfilPago(e.target.value)} className={selectCls}>
            <option value="todos">Perfil pago: Todos</option>
            <option value="buen_pagador">Buen pagador</option>
            <option value="PAGA PERO HAY QUE PRESIONAR">Hay que presionar</option>
            <option value="MAL PAGADOR">Mal pagador</option>
            <option value="sin_perfil">Sin perfil</option>
          </select>

          {/* Activo */}
          <select value={activo} onChange={(e) => setActivo(e.target.value)} className={selectCls}>
            <option value="todos">Activo: Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          {/* Limpiar */}
          {hayFiltros && (
            <button onClick={limpiar} className="text-sm text-[#4B5EEF] hover:text-[#3a4edf] font-medium whitespace-nowrap">
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contador */}
      <p className="text-xs text-gray-400 mb-2">
        {filtrados.length === clientes.length
          ? `${clientes.length} clientes`
          : `${filtrados.length} de ${clientes.length} clientes`}
      </p>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#B8C2FF] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Nombre WhatsApp</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Razón Social</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Doc</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Tipo Venta</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Perfil pago</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Comportamiento de pago</th>
              <th className="text-center px-4 py-3 text-[#1A1A2E] font-semibold">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  {hayFiltros ? 'Ningún cliente coincide con los filtros' : 'No hay clientes'}
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className={`transition-colors ${c.activo === false ? 'opacity-50 bg-gray-50' : 'hover:bg-[#F7F8F8]'}`}>
                <td className="px-4 py-3 font-medium text-[#1A1A2E]">
                  {c.nombre_whatsapp || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                  <span className="line-clamp-1">{c.razon_social}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-400">{c.tipo_doc} </span>
                  {c.num_doc || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.tipo_venta === 'credito' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.tipo_venta === 'credito' ? 'Crédito' : 'Contado'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <BadgePerfil perfil={c.perfil_pago} />
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[220px]">
                  {c.comportamiento_pago
                    ? <span className="line-clamp-2 text-xs" title={c.comportamiento_pago}>{c.comportamiento_pago}</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleActivoCliente id={c.id} activo={c.activo !== false} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/clientes/${c.id}`} className="text-[#4B5EEF] hover:text-[#3a4edf] font-medium text-xs">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

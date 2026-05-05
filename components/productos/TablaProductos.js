'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'

function formatearSoles(monto) {
  if (monto == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

const selectCls = 'border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] bg-white focus:outline-none focus:ring-2 focus:ring-[#4B5EEF]'

export default function TablaProductos({ productos, stockMap, esAdmin }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [stockFiltro, setStockFiltro] = useState('todos')

  const hayFiltros = busqueda || categoriaFiltro || stockFiltro !== 'todos'

  function limpiar() {
    setBusqueda('')
    setCategoriaFiltro('')
    setStockFiltro('todos')
  }

  const categorias = useMemo(() => {
    const set = new Set()
    for (const p of productos) {
      if (p.categoria) set.add(p.categoria)
    }
    return [...set].sort()
  }, [productos])

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return productos.filter((p) => {
      if (categoriaFiltro && p.categoria !== categoriaFiltro) return false
      if (stockFiltro !== 'todos') {
        const stockReal = stockMap[p.id]?.stock_real ?? 0
        if (stockFiltro === 'con_stock' && stockReal <= 0) return false
        if (stockFiltro === 'sin_stock' && stockReal > 0) return false
      }
      if (!q) return true
      return (
        (p.codigo || '').toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q)
      )
    })
  }, [productos, busqueda, categoriaFiltro, stockFiltro, stockMap])

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
              placeholder="Buscar por código, nombre o categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#B8C2FF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white"
            />
          </div>

          {/* Categoría */}
          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={selectCls}>
            <option value="">Categoría: Todas</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stock */}
          <select value={stockFiltro} onChange={(e) => setStockFiltro(e.target.value)} className={selectCls}>
            <option value="todos">Stock: Todos</option>
            <option value="con_stock">Con stock</option>
            <option value="sin_stock">Sin stock</option>
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
        {filtrados.length === productos.length
          ? `${productos.length} productos`
          : `${filtrados.length} de ${productos.length} productos`}
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-[#B8C2FF] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Código</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Nombre</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Categoría</th>
              <th className="text-center px-4 py-3 text-[#1A1A2E] font-semibold">Stock Real</th>
              <th className="text-center px-4 py-3 text-[#1A1A2E] font-semibold">Stock SUNAT</th>
              <th className="text-right px-4 py-3 text-[#1A1A2E] font-semibold">Precio Venta</th>
              <th className="text-right px-4 py-3 text-[#1A1A2E] font-semibold">Precio SUNAT</th>
              {esAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  {hayFiltros ? 'Ningún producto coincide con los filtros' : 'No hay productos registrados'}
                </td>
              </tr>
            )}
            {filtrados.map((prod) => {
              const stockData = stockMap[prod.id]
              const stockReal = stockData?.stock_real ?? 0
              const stockSunat = stockData?.stock_sunat ?? 0
              return (
                <tr key={prod.id} className="hover:bg-[#F7F8F8]">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{prod.codigo || '—'}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1A2E]">{prod.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{prod.categoria || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${stockReal > 0 ? 'text-[#1A1A2E]' : 'text-red-500'}`}>
                      {stockReal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-gray-500">{stockSunat}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1A2E]">
                    {formatearSoles(prod.precio_venta_real)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatearSoles(prod.precio_sunat)}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/productos/${prod.id}`} title="Ver detalle"
                          className="p-1.5 rounded-lg text-[#4B5EEF] hover:bg-[#EBEEFF] transition-colors">
                          <Eye size={18} />
                        </Link>
                        <Link href={`/productos/${prod.id}/editar`} title="Editar"
                          className="p-1.5 rounded-lg text-[#4B5EEF] hover:bg-[#EBEEFF] transition-colors">
                          <Pencil size={18} />
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

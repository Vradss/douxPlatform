'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function formatearSoles(monto) {
  if (monto == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

export default function TablaProductos({ productos, stockMap, esAdmin }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  const categorias = useMemo(() => {
    const set = new Set()
    for (const p of productos) {
      if (p.categoria) set.add(p.categoria)
    }
    return [...set].sort()
  }, [productos])

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return productos.filter(p => {
      if (categoriaFiltro && p.categoria !== categoriaFiltro) return false
      if (!q) return true
      return (
        (p.codigo || '').toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q)
      )
    })
  }, [productos, busqueda, categoriaFiltro])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código, nombre o categoría..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Código</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoría</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Stock Real</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Stock SUNAT</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Precio Venta</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Precio SUNAT</th>
              {esAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!filtrados.length && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  {busqueda || categoriaFiltro
                    ? 'No se encontraron productos con ese filtro'
                    : 'No hay productos registrados'}
                </td>
              </tr>
            )}
            {filtrados.map((prod) => {
              const stockData = stockMap[prod.id]
              const stockReal = stockData?.stock_real ?? 0
              const stockSunat = stockData?.stock_sunat ?? 0
              return (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{prod.codigo || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{prod.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{prod.categoria || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${stockReal > 0 ? 'text-gray-700' : 'text-red-500'}`}>
                      {stockReal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-gray-500">{stockSunat}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                    {formatearSoles(prod.precio_venta_real)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatearSoles(prod.precio_sunat)}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right">
                      <Link href={`/productos/${prod.id}/editar`} className="text-gray-400 hover:text-pink-600 transition-colors" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block">
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-400 text-xs mt-2">
        {filtrados.length === productos.length
          ? `${productos.length} productos`
          : `${filtrados.length} de ${productos.length} productos`}
      </p>
    </>
  )
}

// Header superior — Client Component para mostrar título de página dinámico
'use client'

import { usePathname } from 'next/navigation'

// Mapa de rutas a títulos legibles
const TITULOS = {
  '/': 'Dashboard',
  '/notas-pedido': 'Pedidos',
  '/notas-pedido/nueva': 'Nuevo Pedido',
  '/clientes': 'Clientes',
  '/clientes/nuevo': 'Nuevo Cliente',
  '/cobros': 'Cobranzas',
  '/cobros/nuevo': 'Registrar Cobro',
  '/productos': 'Productos',
  '/productos/nuevo': 'Nuevo Producto',
  '/polizas': 'Pólizas',
  '/reservas': 'Reservas',
  '/gastos': 'Gastos',
}

function obtenerTitulo(pathname) {
  // Coincidencia exacta primero
  if (TITULOS[pathname]) return TITULOS[pathname]

  // Para rutas dinámicas como /clientes/[id], /notas-pedido/[id], etc.
  if (pathname.startsWith('/clientes/') && pathname.endsWith('/editar')) return 'Editar Cliente'
  if (pathname.startsWith('/clientes/')) return 'Detalle de Cliente'
  if (pathname.startsWith('/notas-pedido/')) return 'Detalle de Pedido'
  if (pathname.startsWith('/productos/')) return 'Editar Producto'

  return 'Gestión'
}

export default function Header({ usuario }) {
  const pathname = usePathname()
  const titulo = obtenerTitulo(pathname)

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #B8C2FF',
      }}
    >
      {/* Título de la sección actual */}
      <h1 className="font-semibold text-base" style={{ color: '#1A1A2E' }}>
        {titulo}
      </h1>

      {/* Info del usuario */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight" style={{ color: '#1A1A2E' }}>
            {usuario?.nombre}
          </p>
          <p className="text-xs capitalize" style={{ color: '#4B5EEF' }}>
            {usuario?.rol}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: '#EBEEFF', color: '#4B5EEF' }}
        >
          {usuario?.nombre?.[0] ?? '?'}
        </div>
      </div>
    </header>
  )
}

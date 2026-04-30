// Sidebar de navegación — Client Component
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const navegacion = [
  {
    href: '/',
    label: 'Dashboard',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/notas-pedido',
    label: 'Pedidos',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
  {
    href: '/clientes',
    label: 'Clientes',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.916-3.5M9 20H4v-2a4 4 0 015.916-3.5M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z"/>
      </svg>
    ),
  },
  {
    href: '/cobros',
    label: 'Cobranzas',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    href: '/productos',
    label: 'Productos',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
      </svg>
    ),
  },
  {
    href: '/polizas',
    label: 'Pólizas',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
  },
  {
    href: '/reservas',
    label: 'Reservas',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    href: '/gastos',
    label: 'Gastos',
    icono: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
    ),
  },
]

export default function Sidebar({ usuario }) {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 min-h-screen flex flex-col"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(184,194,255,0.15)' }}>
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#4B5EEF' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: '#FFFFFF' }}>
              Doux Bebé
            </p>
            <p className="text-xs" style={{ color: '#B8C2FF' }}>
              Gestión
            </p>
          </div>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navegacion.map((item) => {
          const activo =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: activo ? '#FFFFFF' : '#B8C2FF',
                backgroundColor: activo ? '#4B5EEF' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!activo) {
                  e.currentTarget.style.backgroundColor = 'rgba(75,94,239,0.15)'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (!activo) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#B8C2FF'
                }
              }}
            >
              <span style={{ color: activo ? '#FFFFFF' : '#B8C2FF' }}>
                {item.icono}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario y logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(184,194,255,0.15)' }}>
        <div className="flex items-center gap-3 px-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#4B5EEF', color: '#FFFFFF' }}
          >
            {usuario?.nombre?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#FFFFFF' }}>
              {usuario?.nombre}
            </p>
            <p className="text-xs capitalize" style={{ color: '#B8C2FF' }}>
              {usuario?.rol}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors"
            style={{ color: '#B8C2FF' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.backgroundColor = 'rgba(255,80,80,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#B8C2FF'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

// GestorNPs — Client Component principal para la pantalla de Notas de Pedido
// Maneja filtros, tabla, modal de creación y drawer de detalle
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ModalNuevaNP from './ModalNuevaNP'
import DrawerDetalleNP from './DrawerDetalleNP'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Generar lista de los últimos 12 meses para el selector
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

// ─── Badge de estado ──────────────────────────────────────────────────────────

function BadgeEstado({ estado }) {
  const config = {
    pendiente: { label: 'Pendiente', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
    entregado: { label: 'Entregado', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
    anulado:   { label: 'Anulado',   bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  }[estado] ?? { label: estado, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' }

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: config.bg, color: config.color, borderColor: config.border }}
    >
      {config.label}
    </span>
  )
}

// ─── Badge de comprobante ─────────────────────────────────────────────────────

function BadgeComprobante({ tipo, numero }) {
  if (!tipo || tipo === 'ninguno') return <span className="text-gray-300">—</span>

  const letra = tipo === 'factura' ? 'F' : 'B'
  const serie = numero ? numero.split('-')[0] : `${letra}001`

  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: '#EBEEFF', color: '#4B5EEF' }}
    >
      {serie}
    </span>
  )
}

// ─── Resumen de productos en la fila ─────────────────────────────────────────

function ResumenProductos({ items }) {
  if (!items?.length) return <span className="text-gray-400">—</span>
  const primero = items[0]
  const texto = primero.codigo
    ? `${primero.codigo} ${primero.descripcion}`
    : primero.descripcion
  return (
    <span className="text-gray-600 text-sm">
      {texto.length > 32 ? texto.slice(0, 32) + '…' : texto}
      {items.length > 1 && (
        <span className="text-gray-400 ml-1">+{items.length - 1} más</span>
      )}
    </span>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function GestorNPs({ npsIniciales, clientes, productos, siguienteNumero, modoDemo }) {
  const router = useRouter()

  // Estado local de NPs (se actualiza al crear una nueva)
  const [nps, setNps] = useState(npsIniciales)

  // Filtros
  const mesActual = MESES[0].valor
  const [filtroMes, setFiltroMes] = useState(mesActual)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busquedaCliente, setBusquedaCliente] = useState('')

  // Modal y drawer
  const [modalAbierto, setModalAbierto] = useState(false)
  const [npSeleccionada, setNpSeleccionada] = useState(null)

  // ── Filtrado cliente-side ─────────────────────────────────────────────────
  const npsFiltradas = useMemo(() => {
    return nps.filter((np) => {
      // Filtro por mes
      if (filtroMes && !np.fecha.startsWith(filtroMes)) return false
      // Filtro por estado
      if (filtroEstado !== 'todos' && np.estado !== filtroEstado) return false
      // Búsqueda por cliente
      if (busquedaCliente) {
        const q = busquedaCliente.toLowerCase()
        const ws = (np.clientes?.nombre_whatsapp ?? '').toLowerCase()
        const rs = (np.clientes?.razon_social ?? '').toLowerCase()
        if (!ws.includes(q) && !rs.includes(q)) return false
      }
      return true
    })
  }, [nps, filtroMes, filtroEstado, busquedaCliente])

  // ── Totales del filtro actual ─────────────────────────────────────────────
  const totalFiltrado = npsFiltradas.reduce((acc, np) => acc + (np.total ?? 0), 0)

  // ── Callbacks ─────────────────────────────────────────────────────────────

  // Al crear una nueva NP: agregar al inicio de la lista local y refrescar Server Component
  function onNPCreada(nuevaNP) {
    setNps((prev) => [nuevaNP, ...prev])
    setModalAbierto(false)
    if (!modoDemo) router.refresh()
  }

  // Al cambiar estado desde el drawer: actualizar localmente
  function onEstadoCambiado(id, nuevoEstado) {
    setNps((prev) =>
      prev.map((np) => (np.id === id ? { ...np, estado: nuevoEstado } : np))
    )
    setNpSeleccionada((prev) => prev ? { ...prev, estado: nuevoEstado } : prev)
    if (!modoDemo) router.refresh()
  }

  // ── Tabs de estado ────────────────────────────────────────────────────────
  const TABS = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'pendiente', label: 'Pendiente' },
    { valor: 'entregado', label: 'Entregado' },
    { valor: 'anulado', label: 'Anulado' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6" style={{ color: '#1A1A2E' }}>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm" style={{ color: '#4B5EEF' }}>
            {npsFiltradas.length} pedido{npsFiltradas.length !== 1 ? 's' : ''} ·{' '}
            {formatearSoles(totalFiltrado)}
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#4B5EEF', color: '#FFFFFF' }}
        >
          <span className="text-base leading-none">+</span>
          Nueva NP
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Selector de mes */}
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border outline-none"
          style={{ borderColor: '#B8C2FF', backgroundColor: '#FFFFFF', color: '#1A1A2E' }}
        >
          <option value="">Todos los meses</option>
          {MESES.map((m) => (
            <option key={m.valor} value={m.valor}>{m.label}</option>
          ))}
        </select>

        {/* Buscador de cliente */}
        <input
          type="text"
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
          placeholder="Buscar cliente..."
          className="text-sm px-3 py-1.5 rounded-lg border outline-none w-48"
          style={{ borderColor: '#B8C2FF', backgroundColor: '#FFFFFF', color: '#1A1A2E' }}
        />
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-1 mb-4">
        {TABS.map((tab) => {
          const activo = filtroEstado === tab.valor
          return (
            <button
              key={tab.valor}
              onClick={() => setFiltroEstado(tab.valor)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: activo ? '#4B5EEF' : '#FFFFFF',
                color: activo ? '#FFFFFF' : '#1A1A2E',
                border: `1px solid ${activo ? '#4B5EEF' : '#B8C2FF'}`,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tabla ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #B8C2FF', backgroundColor: '#FFFFFF' }}
      >
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#EBEEFF' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Fecha</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>N° NP</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Cliente</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Productos</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Total S/</th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Estado</th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>Comp.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {npsFiltradas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10" style={{ color: '#B8C2FF' }}>
                  No hay pedidos en este período
                </td>
              </tr>
            )}
            {npsFiltradas.map((np, i) => (
              <tr
                key={np.id}
                className="cursor-pointer transition-colors"
                style={{
                  borderTop: i === 0 ? 'none' : `1px solid #EBEEFF`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F7F8F8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setNpSeleccionada(np)}
              >
                <td className="px-4 py-3 text-gray-500">{formatearFecha(np.fecha)}</td>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: '#1A1A2E' }}>
                  {np.numero}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>
                  {np.clientes?.nombre_whatsapp || np.clientes?.razon_social}
                </td>
                <td className="px-4 py-3">
                  <ResumenProductos items={np.notas_pedido_items} />
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1A1A2E' }}>
                  {formatearSoles(np.total)}
                </td>
                <td className="px-4 py-3 text-center">
                  <BadgeEstado estado={np.estado} />
                </td>
                <td className="px-4 py-3 text-center">
                  <BadgeComprobante tipo={np.tipo_comprobante} numero={np.numero_comprobante} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span style={{ color: '#4B5EEF' }} className="text-xs font-medium">
                    Ver →
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal nueva NP ── */}
      {modalAbierto && (
        <ModalNuevaNP
          clientes={clientes}
          productos={productos}
          siguienteNumero={siguienteNumero}
          modoDemo={modoDemo}
          onClose={() => setModalAbierto(false)}
          onCreada={onNPCreada}
        />
      )}

      {/* ── Drawer detalle ── */}
      {npSeleccionada && (
        <DrawerDetalleNP
          np={npSeleccionada}
          modoDemo={modoDemo}
          onClose={() => setNpSeleccionada(null)}
          onEstadoCambiado={onEstadoCambiado}
        />
      )}
    </div>
  )
}

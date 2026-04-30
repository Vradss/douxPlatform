// Drawer de detalle de Nota de Pedido — desliza desde la derecha
'use client'

import { useEffect } from 'react'
import { cambiarEstadoNP } from '@/app/actions/notas-pedido'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  entregado: { label: 'Entregado', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  anulado:   { label: 'Anulado',   bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
}

export default function DrawerDetalleNP({ np, modoDemo, onClose, onEstadoCambiado }) {
  // Cerrar con Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const estado = ESTADO_CONFIG[np.estado] ?? ESTADO_CONFIG.pendiente

  async function cambiarEstado(nuevoEstado) {
    if (modoDemo) { onEstadoCambiado(np.id, nuevoEstado); return }

    const resultado = await cambiarEstadoNP(np.id, nuevoEstado)
    if (!resultado?.error) {
      onEstadoCambiado(np.id, nuevoEstado)
    }
  }

  return (
    <>
      {/* Backdrop semi-transparente */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26,26,46,0.3)' }}
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: '440px',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #B8C2FF',
          boxShadow: '-8px 0 32px rgba(75,94,239,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #EBEEFF' }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg" style={{ color: '#1A1A2E' }}>
              {np.numero}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{ backgroundColor: estado.bg, color: estado.color, borderColor: estado.border }}
            >
              {estado.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
            style={{ color: '#B8C2FF' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EBEEFF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Datos del cliente */}
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#EBEEFF' }}>
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#B8C2FF' }}>Cliente</p>
              <p className="font-semibold" style={{ color: '#1A1A2E' }}>
                {np.clientes?.nombre_whatsapp || np.clientes?.razon_social}
              </p>
              {np.clientes?.nombre_whatsapp && (
                <p className="text-xs" style={{ color: '#B8C2FF' }}>{np.clientes.razon_social}</p>
              )}
            </div>
          </div>

          {/* Datos del pedido */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#B8C2FF' }}>Fecha</p>
              <p className="capitalize" style={{ color: '#1A1A2E' }}>{formatearFecha(np.fecha)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#B8C2FF' }}>Tipo de venta</p>
              <p className="capitalize font-medium" style={{ color: '#1A1A2E' }}>{np.tipo_venta ?? '—'}</p>
            </div>
            {np.numero_proforma && (
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#B8C2FF' }}>Proforma</p>
                <p style={{ color: '#1A1A2E' }}>{np.numero_proforma}</p>
              </div>
            )}
            {np.tipo_comprobante && np.tipo_comprobante !== 'ninguno' && (
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#B8C2FF' }}>Comprobante</p>
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: '#EBEEFF', color: '#4B5EEF' }}
                >
                  {np.numero_comprobante ?? np.tipo_comprobante}
                </span>
              </div>
            )}
          </div>

          {/* Tabla de items */}
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: '#B8C2FF' }}>
              Productos
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBEEFF' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#EBEEFF' }}>
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: '#1A1A2E' }}>Descripción</th>
                    <th className="text-center px-2 py-2 text-xs font-medium" style={{ color: '#1A1A2E' }}>Cant.</th>
                    <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: '#1A1A2E' }}>P.U.</th>
                    <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: '#1A1A2E' }}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#EBEEFF' }}>
                  {np.notas_pedido_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5">
                        {item.codigo && (
                          <span className="text-xs font-mono font-semibold mr-1.5" style={{ color: '#4B5EEF' }}>
                            {item.codigo}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: '#1A1A2E' }}>{item.descripcion}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center text-xs" style={{ color: '#1A1A2E' }}>
                        {item.cantidad}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs" style={{ color: '#B8C2FF' }}>
                        {formatearSoles(item.precio_unitario)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold" style={{ color: '#1A1A2E' }}>
                        {formatearSoles(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid #EBEEFF', backgroundColor: '#F7F8F8' }}>
                <div className="flex justify-between text-xs" style={{ color: '#B8C2FF' }}>
                  <span>Subtotal sin IGV</span>
                  <span>{formatearSoles(np.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: '#B8C2FF' }}>
                  <span>IGV 18%</span>
                  <span>{formatearSoles(np.igv)}</span>
                </div>
                <div
                  className="flex justify-between font-bold text-sm pt-1.5"
                  style={{ color: '#4B5EEF', borderTop: '1px solid #B8C2FF' }}
                >
                  <span>Total</span>
                  <span>{formatearSoles(np.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comentario */}
          {np.comentario && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#EBEEFF' }}>
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: '#B8C2FF' }}>Comentario</p>
              <p className="text-sm" style={{ color: '#1A1A2E' }}>{np.comentario}</p>
            </div>
          )}
        </div>

        {/* Acciones de estado — pie del drawer */}
        {np.estado !== 'anulado' && (
          <div
            className="flex-shrink-0 px-5 py-4 flex gap-3"
            style={{ borderTop: '1px solid #EBEEFF' }}
          >
            {np.estado === 'pendiente' && (
              <button
                onClick={() => cambiarEstado('entregado')}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#4B5EEF', color: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A4DD0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4B5EEF'}
              >
                Marcar como Entregado
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('¿Seguro que deseas anular este pedido? Esto revertirá el saldo del cliente.')) {
                  cambiarEstado('anulado')
                }
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: '#FCA5A5', color: '#991B1B', backgroundColor: '#FFF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF'}
            >
              Anular
            </button>
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cambiarEstadoNP } from '@/app/actions/notas-pedido'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatearFechaCorta(fecha) {
  if (!fecha) return '—'
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Convierte un número a palabras en español para montos en soles
function montoEnLetras(monto) {
  const entero = Math.floor(monto)
  const centavos = Math.round((monto - entero) * 100)

  const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const DECENAS  = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const ESPECIALES = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const CENTENAS = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function cientos(n) {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'
    let r = CENTENAS[Math.floor(n / 100)]
    const resto = n % 100
    if (resto === 0) return r
    if (r) r += ' '
    if (resto < 10) return r + UNIDADES[resto]
    if (resto < 20) return r + ESPECIALES[resto - 10]
    const d = Math.floor(resto / 10), u = resto % 10
    return r + DECENAS[d] + (u > 0 ? ' Y ' + UNIDADES[u] : '')
  }

  function convertir(n) {
    if (n === 0) return 'CERO'
    let r = ''
    if (n >= 1000000) {
      const m = Math.floor(n / 1000000)
      r += (m === 1 ? 'UN MILLON' : cientos(m) + ' MILLONES') + ' '
      n %= 1000000
    }
    if (n >= 1000) {
      const mi = Math.floor(n / 1000)
      r += (mi === 1 ? 'MIL' : cientos(mi) + ' MIL') + ' '
      n %= 1000
    }
    r += cientos(n)
    return r.trim()
  }

  return `${convertir(entero)} CON ${String(centavos).padStart(2, '0')}/100`
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  entregado: { label: 'Entregado', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  anulada:   { label: 'Anulado',   bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
}

async function generarPDF(np, items, nombreUsuario) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF('p', 'mm', 'a4')

  const W = 210, M = 10, CW = W - 2 * M
  let y = M

  const t = (str, x, yy, opts = {}) => doc.text(String(str ?? ''), x, yy, opts)
  const bold = (on) => doc.setFont('helvetica', on ? 'bold' : 'normal')
  const size = (s) => doc.setFontSize(s)
  const color = (r, g, b) => doc.setTextColor(r, g, b)
  const fill = (r, g, b) => doc.setFillColor(r, g, b)
  const draw = (r, g, b) => doc.setDrawColor(r, g, b)

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Logo (izquierda)
  color(75, 94, 239); bold(true); size(20)
  t('Doux Bebe', M, y + 10)
  color(180, 194, 255); bold(false); size(7)
  t('Siempre contigo', M, y + 15)

  // Info empresa (centro)
  color(26, 26, 46); bold(true); size(9)
  t('CORPORACION DOUX BEBE E.I.R.L.', W / 2, y + 7, { align: 'center' })
  bold(false); size(7)
  t('JR. COTABAMBAS NRO. 315 CERCADO DE LIMA', W / 2, y + 12, { align: 'center' })
  t('998896666  |  douxbebeperu@gmail.com', W / 2, y + 17, { align: 'center' })

  // Caja RUC (derecha)
  const bx = W - M - 55, bw = 55, bh = 32
  draw(75, 94, 239); doc.setLineWidth(0.5)
  doc.rect(bx, y, bw, bh)
  color(26, 26, 46); bold(true); size(8)
  t('R.U.C. 20610532463', bx + bw / 2, y + 6, { align: 'center' })
  draw(200, 200, 220); doc.setLineWidth(0.3)
  doc.line(bx, y + 9, bx + bw, y + 9)
  size(7); bold(false)
  t('NOTA DE PEDIDO', bx + bw / 2, y + 14, { align: 'center' })
  t('ELECTRONICA', bx + bw / 2, y + 18, { align: 'center' })
  doc.line(bx, y + 21, bx + bw, y + 21)
  color(75, 94, 239); bold(true); size(11)
  t(np.numero ?? '', bx + bw / 2, y + 28, { align: 'center' })

  y += 34
  draw(180, 194, 255); doc.setLineWidth(0.4)
  doc.line(M, y, W - M, y)
  y += 5

  // ── DATOS CLIENTE ────────────────────────────────────────────────────────────
  color(26, 26, 46); bold(false); size(8)
  const numDoc = np.clientes?.num_doc || np.clientes?.ruc || '—'
  t(`DNI/RUC: ${numDoc}    RAZON SOCIAL: ${np.clientes?.razon_social ?? '—'}`, M, y)
  y += 5
  const condicion = (np.tipo_venta ?? 'contado').toUpperCase()
  t(`FECHA EMISION: ${formatearFechaCorta(np.fecha)}    MONEDA: SOLES    CONDICION: ${condicion}`, M, y)
  y += 5
  t(`Guia Remision: —    Orden Compra: —    Caja: ${nombreUsuario ?? '—'}`, M, y)
  y += 5

  draw(180, 194, 255); doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)
  y += 4

  // ── TABLA DE PRODUCTOS ───────────────────────────────────────────────────────
  // Anchos columnas: # | CODIGO | DESCRIPCION | CANT | P.UNIT | TOTAL = 190mm
  const cw = [10, 26, 84, 14, 28, 28]
  const cx = [M]
  for (let i = 0; i < cw.length - 1; i++) cx.push(cx[i] + cw[i])

  // Cabecera
  fill(235, 238, 255); draw(235, 238, 255)
  doc.rect(M, y, CW, 7, 'F')
  color(26, 26, 46); bold(true); size(7)
  const hdr = ['#', 'CODIGO', 'DESCRIPCION', 'CANT.', 'P. UNIT.', 'TOTAL']
  const aln = ['center', 'left', 'left', 'center', 'right', 'right']
  hdr.forEach((h, i) => {
    const hx = aln[i] === 'right' ? cx[i] + cw[i] - 1 :
               aln[i] === 'center' ? cx[i] + cw[i] / 2 : cx[i] + 1
    t(h, hx, y + 5, { align: aln[i] })
  })
  y += 7

  // Filas
  bold(false); size(7)
  items.forEach((item, idx) => {
    if (idx % 2 === 1) { fill(247, 248, 248); doc.rect(M, y, CW, 7, 'F') }
    draw(235, 238, 255); doc.setLineWidth(0.2)
    doc.line(M, y + 7, W - M, y + 7)
    color(26, 26, 46)
    t(String(idx + 1), cx[0] + cw[0] / 2, y + 5, { align: 'center' })
    color(75, 94, 239)
    t((item.codigo ?? '—').slice(0, 12), cx[1] + 1, y + 5)
    color(26, 26, 46)
    t((item.descripcion ?? '').slice(0, 48), cx[2] + 1, y + 5)
    t(String(item.cantidad ?? 0), cx[3] + cw[3] / 2, y + 5, { align: 'center' })
    t(`S/ ${(item.precio_unitario ?? 0).toFixed(2)}`, cx[4] + cw[4] - 1, y + 5, { align: 'right' })
    bold(true)
    t(`S/ ${(item.total ?? 0).toFixed(2)}`, cx[5] + cw[5] - 1, y + 5, { align: 'right' })
    bold(false)
    y += 7
  })

  y += 4
  if (y > 225) { doc.addPage(); y = M }

  draw(180, 194, 255); doc.setLineWidth(0.4)
  doc.line(M, y, W - M, y)
  y += 5

  // ── PIE: IZQUIERDO (monto letras + banco) y DERECHO (totales) ────────────────
  const footerStartY = y

  // Totales (derecha)
  const gravada = +(np.subtotal ?? (np.total / 1.18)).toFixed(2)
  const igvMonto = +(np.igv ?? (np.total - gravada)).toFixed(2)
  const tx = W - M - 60, tw = 60
  const filasTotales = [
    ['EXONERADA',  '0.00'],
    ['INAFECTA',   '0.00'],
    ['GRAVADA',    gravada.toFixed(2)],
    ['IGV 18%',    igvMonto.toFixed(2)],
    ['GRATUITA',   '0.00'],
  ]

  draw(180, 194, 255); doc.setLineWidth(0.3)
  color(26, 26, 46); size(8)
  filasTotales.forEach(([lbl, val], i) => {
    const fy = footerStartY + i * 6
    if (i % 2 === 1) { fill(247, 248, 248); doc.rect(tx, fy, tw, 6, 'F') }
    bold(false); t(lbl, tx + 2, fy + 4)
    bold(false); t(`S/ ${val}`, tx + tw - 2, fy + 4, { align: 'right' })
  })
  const totalY = footerStartY + filasTotales.length * 6
  fill(235, 238, 255); doc.rect(tx, totalY, tw, 7, 'F')
  draw(75, 94, 239); doc.rect(tx, totalY, tw, 7)
  color(75, 94, 239); bold(true); size(9)
  t('TOTAL', tx + 2, totalY + 5)
  t(`S/ ${(np.total ?? 0).toFixed(2)}`, tx + tw - 2, totalY + 5, { align: 'right' })

  // Izquierda
  y = footerStartY
  color(26, 26, 46); bold(true); size(8)
  const letras = montoEnLetras(np.total ?? 0)
  t(`SON: ${letras} SOLES`, M, y)
  y += 5; bold(false); size(7)

  if (np.numero_proforma) { t(`OBSERVACIONES: PROFORMA ${np.numero_proforma}`, M, y); y += 4 }
  t('Representacion impresa de la Nota de pedido', M, y); y += 5

  bold(true); t('CUENTAS BANCARIAS:', M, y); y += 4
  bold(false)
  t('INTERBANK SOLES CTA CTE: 200-300530316-6', M, y); y += 3.5
  t('CCI: 003-200003005303166-39', M, y); y += 4
  bold(true); t('YAPE: 998 896 666', M, y); y += 4
  t('BCP SOLES CTA AHORROS: 191-744661130-94', M, y); y += 3.5
  bold(false); t('CCI: 002-191174466113094-50', M, y); y += 6

  const ahora = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  t(`USUARIO: ${nombreUsuario ?? '—'}    FECHA Y HORA: ${ahora}`, M, y); y += 5

  color(75, 94, 239)
  const frase = doc.splitTextToSize(
    '"Eres la razon de nuestro trabajo diario. Tu compra es un voto de confianza... Gracias por tenernos en cuenta."',
    115
  )
  doc.text(frase, M, y)

  doc.save(`${np.numero ?? 'NP'}.pdf`)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DrawerDetalleNP({ np, modoDemo, onClose, onEstadoCambiado, nombreUsuario }) {
  const [items, setItems] = useState(np.notas_pedido_items ?? [])
  const [generandoPDF, setGenerandoPDF] = useState(false)

  useEffect(() => {
    if (np.notas_pedido_items?.length) {
      setItems(np.notas_pedido_items)
      return
    }
    if (modoDemo) return
    const supabase = createClient()
    supabase
      .from('notas_pedido_items')
      .select('id, codigo, descripcion, cantidad, precio_unitario, total')
      .eq('nota_pedido_id', np.id)
      .then(({ data, error }) => {
        if (error) console.log('[DrawerNP] Error items:', JSON.stringify(error))
        setItems(data ?? [])
      })
  }, [np.id, modoDemo, np.notas_pedido_items])

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const estado = ESTADO_CONFIG[np.estado] ?? ESTADO_CONFIG.pendiente

  async function cambiarEstado(nuevoEstado) {
    if (modoDemo) { onEstadoCambiado(np.id, nuevoEstado); return }
    const resultado = await cambiarEstadoNP(np.id, nuevoEstado)
    if (!resultado?.error) onEstadoCambiado(np.id, nuevoEstado)
  }

  async function handlePDF() {
    setGenerandoPDF(true)
    try {
      await generarPDF(np, items, nombreUsuario)
    } catch (e) {
      console.error('[PDF]', e)
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26,26,46,0.3)' }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: '460px',
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePDF}
              disabled={generandoPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: generandoPDF ? '#EBEEFF' : '#4B5EEF',
                color: generandoPDF ? '#B8C2FF' : '#FFFFFF',
              }}
            >
              {generandoPDF ? 'Generando…' : '↓ Imprimir NP'}
            </button>
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
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Datos del cliente */}
          <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: '#EBEEFF' }}>
            <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#B8C2FF' }}>Cliente</p>
            <p className="font-semibold" style={{ color: '#1A1A2E' }}>
              {np.clientes?.nombre_whatsapp || np.clientes?.razon_social || '—'}
            </p>
            {np.clientes?.nombre_whatsapp && (
              <p className="text-xs" style={{ color: '#B8C2FF' }}>{np.clientes.razon_social}</p>
            )}
            {(np.clientes?.num_doc || np.clientes?.ruc) && (
              <p className="text-xs font-mono" style={{ color: '#B8C2FF' }}>
                {np.clientes.num_doc || np.clientes.ruc}
              </p>
            )}
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
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs" style={{ color: '#B8C2FF' }}>
                  Sin productos registrados
                </p>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead style={{ backgroundColor: '#EBEEFF' }}>
                      <tr>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: '#1A1A2E' }}>Código</th>
                        <th className="text-left px-2 py-2 font-medium" style={{ color: '#1A1A2E' }}>Descripción</th>
                        <th className="text-center px-2 py-2 font-medium" style={{ color: '#1A1A2E' }}>Cant.</th>
                        <th className="text-right px-2 py-2 font-medium" style={{ color: '#1A1A2E' }}>P.U.</th>
                        <th className="text-right px-3 py-2 font-medium" style={{ color: '#1A1A2E' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#EBEEFF' }}>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-semibold" style={{ color: '#4B5EEF' }}>
                              {item.codigo || '—'}
                            </span>
                          </td>
                          <td className="px-2 py-2.5" style={{ color: '#1A1A2E' }}>{item.descripcion}</td>
                          <td className="px-2 py-2.5 text-center" style={{ color: '#1A1A2E' }}>{item.cantidad}</td>
                          <td className="px-2 py-2.5 text-right" style={{ color: '#B8C2FF' }}>
                            {formatearSoles(item.precio_unitario)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold" style={{ color: '#1A1A2E' }}>
                            {formatearSoles(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                </>
              )}
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

        {/* Acciones de estado */}
        {np.estado !== 'anulada' && (
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
                if (confirm('¿Seguro que deseas anular este pedido? Se revertirá el saldo del cliente y el stock.')) {
                  cambiarEstado('anulada')
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

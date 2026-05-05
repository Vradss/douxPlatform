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

  const W = 210, M = 10, CW = W - 2 * M  // CW = 190mm
  let y = M

  const t    = (str, x, yy, opts = {}) => doc.text(String(str ?? ''), x, yy, opts)
  const bold  = (on) => doc.setFont('helvetica', on ? 'bold' : 'normal')
  const size  = (s)  => doc.setFontSize(s)
  const color = (r, g, b) => doc.setTextColor(r, g, b)
  const fill  = (r, g, b) => doc.setFillColor(r, g, b)
  const draw  = (r, g, b) => doc.setDrawColor(r, g, b)
  const lw    = (w)       => doc.setLineWidth(w)

  // Color gris claro para todos los bordes (#CCCCCC)
  const G = () => draw(204, 204, 204)

  // ── LOGO (SVG → canvas → PNG) ─────────────────────────────────────────────
  const LOGO_W = 40, LOGO_H = LOGO_W * (196 / 438)
  try {
    const logoDataUrl = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(LOGO_W * 3.78 * 3)
        canvas.height = Math.round(LOGO_H * 3.78 * 3)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = '/logo_doux_bebe.svg'
    })
    doc.addImage(logoDataUrl, 'PNG', M, y + (30 - LOGO_H) / 2, LOGO_W, LOGO_H)
  } catch {
    color(75, 94, 239); bold(true); size(16)
    t('Doux', M, y + 14)
    bold(false); size(10)
    t('Bébé', M, y + 21)
  }

  // ── INFO EMPRESA (centro) ─────────────────────────────────────────────────
  const logoRegionW = 44, rucBW = 57
  const cenX = M + logoRegionW + (CW - logoRegionW - rucBW) / 2

  color(26, 26, 46); bold(true); size(8.5)
  t('CORPORACION DOUX BÉBÈ E.I.R.L.', cenX, y + 6, { align: 'center' })
  bold(false); size(6.5)
  t('JR. COTABAMBAS NRO. 315 CERCADO DE LIMA LIMA - LIMA - LIMA', cenX, y + 11, { align: 'center' })
  t('LIMA', cenX, y + 15, { align: 'center' })
  t('998896666', cenX, y + 19, { align: 'center' })
  t('Email: douxbebeperu@gmail.com', cenX, y + 23, { align: 'center' })

  // ── CAJA RUC (derecha) ────────────────────────────────────────────────────
  const bx = W - M - rucBW, bh = 30
  G(); lw(0.5)
  doc.rect(bx, y, rucBW, bh)
  color(26, 26, 46); bold(true); size(7.5)
  t('R.U.C. 20610532463', bx + rucBW / 2, y + 6, { align: 'center' })
  G(); lw(0.3)
  doc.line(bx, y + 9, bx + rucBW, y + 9)
  size(9)
  t('NOTA DE PEDIDO', bx + rucBW / 2, y + 15, { align: 'center' })
  t('ELECTRONICA', bx + rucBW / 2, y + 21, { align: 'center' })
  doc.line(bx, y + 23, bx + rucBW, y + 23)
  size(11); color(26, 26, 46)
  t(np.numero ?? '', bx + rucBW / 2, y + 29, { align: 'center' })

  y += bh + 2

  // ── SEPARADOR ─────────────────────────────────────────────────────────────
  G(); lw(0.4)
  doc.line(M, y, W - M, y)
  y += 2

  // ── DATOS DEL CLIENTE + FECHA BOX ─────────────────────────────────────────
  const clientW = CW - 65, dateW = 65, clientH = 22
  G(); lw(0.3)
  doc.rect(M, y, clientW, clientH)
  doc.rect(M + clientW, y, dateW, clientH)

  color(26, 26, 46); bold(true); size(7.5)
  t('DATOS DEL CLIENTE', M + 2, y + 5)
  bold(false); size(7)

  const tipoDoc = np.clientes?.tipo_doc || (np.clientes?.ruc && !np.clientes?.num_doc ? 'RUC' : 'DNI')
  const numDoc  = np.clientes?.num_doc || np.clientes?.ruc || '—'
  const direc   = np.clientes?.direccion || ''

  t(`${tipoDoc}: ${numDoc}`, M + 2, y + 11)
  t(`RAZÓN SOCIAL: ${(np.clientes?.razon_social ?? '—').slice(0, 50)}`, M + 2, y + 17)
  t(`DIRECCIÓN: ${direc.slice(0, 55)}`, M + 2, y + 21.5)

  const dx = M + clientW + 2
  bold(true); size(7)
  t(`FECHA EMISION: ${formatearFechaCorta(np.fecha)}`, dx, y + 6)
  t('MONEDA: SOLES', dx, y + 12)
  const condicion = np.tipo_venta === 'credito' ? 'CRÉDITO / FE. VE.:' : (np.tipo_venta ?? 'contado').toUpperCase()
  t(`CONDICION: ${condicion}`, dx, y + 18)

  y += clientH

  // ── GUIA / ORDEN / CAJA ───────────────────────────────────────────────────
  const guiaH = 6, g = CW / 3
  G(); lw(0.3)
  doc.rect(M, y, CW, guiaH)
  doc.line(M + g, y, M + g, y + guiaH)
  doc.line(M + 2 * g, y, M + 2 * g, y + guiaH)
  color(26, 26, 46); bold(true); size(7)
  t('Guía Remisión:', M + 2, y + 4)
  t('Orden Compra:', M + g + 2, y + 4)
  t(`Caja: ${nombreUsuario ?? '—'}`, M + 2 * g + 2, y + 4)
  bold(false)
  y += guiaH

  // ── TABLA DE PRODUCTOS ────────────────────────────────────────────────────
  // Anchos: # | CODIGO | DESCRIPCION | CANT. | PRECIO UNIT. | TOTAL = 190mm
  const cw = [9, 22, 91, 14, 28, 26]
  const cx = [M]
  for (let i = 0; i < cw.length - 1; i++) cx.push(cx[i] + cw[i])
  const rowH = 7

  // Cabecera tabla — fondo gris claro #F5F5F5
  fill(245, 245, 245); G(); lw(0.3)
  doc.rect(M, y, CW, rowH, 'F')
  doc.rect(M, y, CW, rowH)
  cw.forEach((_, i) => { if (i > 0) doc.line(cx[i], y, cx[i], y + rowH) })
  color(26, 26, 46); bold(true); size(7)
  const hdrs = ['#', 'CODIGO', 'DESCRIPCION', 'CANT.', 'PRECIO UNIT.', 'TOTAL']
  const alns = ['center', 'left', 'left', 'center', 'right', 'right']
  hdrs.forEach((h, i) => {
    const hx = alns[i] === 'right' ? cx[i] + cw[i] - 1.5
             : alns[i] === 'center' ? cx[i] + cw[i] / 2 : cx[i] + 1.5
    t(h, hx, y + 4.5, { align: alns[i] })
  })
  y += rowH

  // Solo filas con productos (sin filas vacías)
  items.forEach((item, ri) => {
    if (ri % 2 === 1) { fill(250, 250, 250); doc.rect(M, y, CW, rowH, 'F') }
    G(); lw(0.2)
    doc.rect(M, y, CW, rowH)
    cw.forEach((_, i) => { if (i > 0) doc.line(cx[i], y, cx[i], y + rowH) })
    color(26, 26, 46); bold(false); size(7)
    t(String(ri + 1), cx[0] + cw[0] / 2, y + 4.5, { align: 'center' })
    t((item.codigo ?? '—').slice(0, 10), cx[1] + 1.5, y + 4.5)
    t((item.descripcion ?? '').slice(0, 52), cx[2] + 1.5, y + 4.5)
    t(String(item.cantidad ?? 0), cx[3] + cw[3] / 2, y + 4.5, { align: 'center' })
    t((item.precio_unitario ?? 0).toFixed(2), cx[4] + cw[4] - 1.5, y + 4.5, { align: 'right' })
    bold(true)
    t((item.total ?? 0).toFixed(2), cx[5] + cw[5] - 1.5, y + 4.5, { align: 'right' })
    bold(false)
    y += rowH
  })

  y += 4

  // ── PIE ───────────────────────────────────────────────────────────────────
  const fY = y
  const lcW = 124, rcX = M + lcW + 2, rcW = 64  // 124+2+64=190 ✓

  let ly = fY

  // Caja SON
  G(); lw(0.3)
  doc.rect(M, ly, lcW, 7)
  color(26, 26, 46); bold(true); size(7)
  t('SON: ', M + 2, ly + 5)
  const sonPfx = doc.getTextWidth('SON: ')
  bold(false)
  t(montoEnLetras(np.total ?? 0) + ' SOLES', M + 2 + sonPfx, ly + 5)
  ly += 7

  // Caja OBSERVACIONES
  if (np.numero_proforma) {
    G(); lw(0.3)
    doc.rect(M, ly, lcW, 7)
    color(26, 26, 46); bold(true); size(7)
    t('OBSERVACIONES: ', M + 2, ly + 5)
    const obsPfx = doc.getTextWidth('OBSERVACIONES: ')
    bold(false)
    t(`PROFORMA ${np.numero_proforma}`, M + 2 + obsPfx, ly + 5)
    ly += 7
  }

  // "Representacion impresa"
  color(26, 26, 46); bold(false); size(6.5)
  t('Representacion impresa de la Nota de pedido', M + 2, ly + 5)
  ly += 7

  // Cuentas bancarias
  color(26, 26, 46); bold(true); size(7)
  t('CUENTAS BANCARIAS (CORPORACION DOUX BÉBÈ E.I.R.L.)', M + 2, ly + 4)
  ly += 5
  bold(false); size(6.5)
  t('INTERBANK SOLES CUENTA CORRIENTE:200-300530316-6', M + 2, ly + 4); ly += 4
  t('CCI.: 003-200003005303166-39', M + 2, ly + 4); ly += 4
  bold(true); t('YAPE SOLES NUMERO:998 896 666', M + 2, ly + 4); bold(false); ly += 4
  t('BCP SOLES CUENTA AHORROS:CTA: 191-744661130-94', M + 2, ly + 4); ly += 4
  t('CCI.: CCI: 002-191174466113094-50', M + 2, ly + 4); ly += 5

  // Tabla CUOTA / IMPORTE / FECHA
  const col3 = lcW / 3
  G(); lw(0.3)
  doc.rect(M, ly, lcW, 6)
  doc.line(M + col3, ly, M + col3, ly + 6)
  doc.line(M + 2 * col3, ly, M + 2 * col3, ly + 6)
  bold(true); size(7); color(26, 26, 46)
  t('CUOTA',   M + col3 / 2,            ly + 4, { align: 'center' })
  t('IMPORTE', M + col3 + col3 / 2,     ly + 4, { align: 'center' })
  t('FECHA',   M + 2 * col3 + col3 / 2, ly + 4, { align: 'center' })
  ly += 6
  doc.rect(M, ly, lcW, 6)
  doc.line(M + col3, ly, M + col3, ly + 6)
  doc.line(M + 2 * col3, ly, M + 2 * col3, ly + 6)
  bold(false); t('1', M + col3 / 2, ly + 4, { align: 'center' })
  ly += 8

  // Usuario / Fecha hora
  size(6); color(26, 26, 46)
  t(`USUARIO: ${nombreUsuario ?? '—'}`, M + 2, ly + 3); ly += 4
  const ahora = new Date().toLocaleString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).replace(',', '')
  t(`FECHA Y HORA DE EMISION: ${ahora}`, M + 2, ly + 3); ly += 5

  // ── COLUMNA DERECHA: TOTALES ──────────────────────────────────────────────
  const gravada  = +(np.subtotal ?? (np.total / 1.18)).toFixed(2)
  const igvMonto = +(np.igv ?? (np.total - gravada)).toFixed(2)
  const filasTotales = [
    ['EXONERADA', '0.00'],
    ['INAFECTA',  '0.00'],
    ['GRAVADA',   gravada.toFixed(2)],
    ['IGV 18%',   igvMonto.toFixed(2)],
    ['GRATUITA',  '0.00'],
  ]
  let ry = fY
  G(); lw(0.3)
  filasTotales.forEach(([lbl, val], i) => {
    if (i % 2 === 1) { fill(248, 248, 248); doc.rect(rcX, ry, rcW, 6, 'F') }
    doc.rect(rcX, ry, rcW, 6)
    color(26, 26, 46); bold(false); size(7)
    t(lbl, rcX + 2, ry + 4)
    t(`S/ ${val}`, rcX + rcW - 2, ry + 4, { align: 'right' })
    ry += 6
  })
  G(); lw(0.4); doc.rect(rcX, ry, rcW, 7)
  bold(true); size(8.5)
  t('TOTAL', rcX + 2, ry + 5)
  t(`S/ ${(np.total ?? 0).toFixed(2)}`, rcX + rcW - 2, ry + 5, { align: 'right' })

  // ── FRASE FINAL ───────────────────────────────────────────────────────────
  const quoteY = Math.max(ly + 2, ry + 12)
  G(); lw(0.3)
  doc.rect(M, quoteY, CW, 18)
  color(26, 26, 46); size(10); bold(false)
  t('"Eres la razón de nuestro trabajo diario.', W / 2, quoteY + 6,  { align: 'center' })
  size(8)
  t('"Tu compra es un voto de confianza...', W / 2, quoteY + 11, { align: 'center' })
  t('Gracias por tenernos en cuenta."',     W / 2, quoteY + 16, { align: 'center' })

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
